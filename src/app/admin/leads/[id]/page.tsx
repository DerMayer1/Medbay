import { notFound } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Route,
  ShieldCheck,
  UserCheck,
  UserRound,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CaseStatusControls } from "@/components/admin/CaseStatusControls";
import { ConversationViewer } from "@/components/admin/ConversationViewer";
import { InternalNotesEditor } from "@/components/admin/InternalNotesEditor";
import { evaluateIntakeCompleteness } from "@/features/intake/domain/intake-completeness";
import type { AuditEvent, IntakeCase, IntakeCaseStatus } from "@/features/intake/domain/types";
import { legacyStatusToIntakeStatus, leadToIntakeCase, leadToPatient } from "@/features/intake/infrastructure/legacy-mappers";
import { withDemoFallback } from "@/lib/demoData";
import { getDemoLeadBundle } from "@/lib/demoStore";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { getLeadBundle } from "@/lib/repository";
import type { ChatMessage } from "@/types/lead";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = (await isPortfolioAdminSession())
    ? getDemoLeadBundle(id)
    : await withDemoFallback(getLeadBundle(id), getDemoLeadBundle(id));
  if (!bundle.lead?.id) notFound();

  const patient = leadToPatient(bundle.lead);
  const intakeCase = leadToIntakeCase(bundle.lead as { id: string }, bundle.conversation?.id as string | undefined);
  const completeness = evaluateIntakeCompleteness(intakeCase.fields);
  const auditEvents = ((bundle.auditEvents || []) as Array<Record<string, unknown>>).map(toAuditEvent);
  const riskFlags = extractRiskFlags(auditEvents, intakeCase.handoffRequired);

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="medbay-label">Intake Case Review</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">{patient.name || "Unnamed patient"}</h1>
          <p className="mt-2 text-sm text-[#737373]">Case ID {intakeCase.id}</p>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] px-5 py-4">
          <p className="text-sm text-[#737373]">Completeness</p>
          <p className="mt-1 text-3xl font-semibold text-[#262626]">{completeness.score}%</p>
          <p className="mt-1 text-xs text-[#737373]">
            {completeness.readyForScheduling ? "Ready for scheduling" : `Missing: ${completeness.missingFields.join(", ")}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <aside className="space-y-6">
          <Panel icon={UserRound} title="Patient profile">
            <Info label="Name" value={patient.name || "Not provided"} />
            <Info label="Contact" value={patient.contact || "Not provided"} />
            <Info label="Email" value={patient.email || "Not provided"} />
            <Info label="Phone" value={patient.phone || "Not provided"} />
          </Panel>

          <CaseStatusControls caseId={intakeCase.id} status={legacyStatusToIntakeStatus(intakeCase.status) as IntakeCaseStatus} />

          <Panel icon={ClipboardList} title="Extracted intake fields">
            <Info label="Reason for visit" value={intakeCase.fields.reasonForVisit || "Not provided"} />
            <Info label="Requested service" value={intakeCase.fields.requestedService || "Not routed"} />
            <Info label="Urgency" value={intakeCase.fields.urgencyLevel || "unknown"} />
            <Info label="Payment" value={intakeCase.fields.paymentType || "unknown"} />
            <Info label="Availability" value={intakeCase.fields.availability || "Not provided"} />
          </Panel>

          <Panel icon={AlertTriangle} title="Risk and handoff">
            <Info label="Status" value={intakeCase.status} />
            <Info label="Handoff required" value={intakeCase.handoffRequired ? "Yes" : "No"} />
            <Info label="Handoff reason" value={intakeCase.handoffReason || "None recorded"} />
            <Info label="Risk flags" value={riskFlags.length ? riskFlags.join(", ") : "None detected"} />
          </Panel>
        </aside>

        <section className="space-y-6">
          <CaseDecisionPanel intakeCase={intakeCase} auditEvents={auditEvents} riskFlags={riskFlags} />
          <CaseTimeline intakeCase={intakeCase} auditEvents={auditEvents} />

          <Panel icon={FileText} title="AI summary">
            <p className="text-sm leading-6 text-[#737373]">{intakeCase.summary || "No AI summary has been generated yet."}</p>
          </Panel>

          <Panel icon={CalendarDays} title="Appointment request / history">
            <div className="space-y-3">
              {((bundle.appointments || []) as Array<Record<string, unknown>>).map((appointment) => (
                <div key={String(appointment.id)} className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4 text-sm">
                  <p className="font-semibold text-[#262626]">{String(appointment.status || "requested")}</p>
                  <p className="mt-1 text-[#737373]">
                    {String(appointment.start_time || "No slot selected")} - {String(appointment.end_time || "pending")}
                  </p>
                  <p className="mt-1 text-[#737373]">{String(appointment.notes || "No notes")}</p>
                </div>
              ))}
              {(!bundle.appointments || bundle.appointments.length === 0) ? (
                <p className="text-sm text-[#737373]">No appointment request has been recorded.</p>
              ) : null}
            </div>
          </Panel>

          <ConversationViewer messages={(bundle.messages || []) as ChatMessage[]} />

          <Panel icon={FileText} title="Internal notes">
            <textarea
              readOnly
              placeholder="Internal notes placeholder for care coordination and operations follow-up."
              className="h-28 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3 text-sm text-[#262626] outline-none"
            />
          </Panel>

          <Panel icon={FileText} title="Audit trail">
            <div className="space-y-3">
              {auditEvents.map((event) => (
                <div
                  key={`${event.action}-${event.createdAt || event.entityId}`}
                  className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm font-semibold text-[#262626]">{formatAuditAction(event.action)}</p>
                      <p className="mt-1 text-xs text-[#737373]">{event.createdAt || "Timestamp unavailable"}</p>
                    </div>
                    {event.actor ? (
                      <span className="rounded-full bg-[#dbeafe] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8]">
                        {event.actor}
                      </span>
                    ) : null}
                  </div>
                  <AuditMetadata event={event} />
                </div>
              ))}
              {auditEvents.length === 0 ? <p className="text-sm text-[#737373]">No audit events recorded yet.</p> : null}
            </div>
          </Panel>
        </section>
      </div>
    </AdminLayout>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-semibold text-[#262626]">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <dt className="font-semibold text-[#262626]">{label}</dt>
      <dd className="mt-1 text-[#737373]">{value}</dd>
    </div>
  );
}

function AuditMetadata({ event }: { event: AuditEvent }) {
  const rows = auditRows(event);
  if (rows.length === 0) return null;

  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md border border-[#ededed] bg-[#ffffff] p-3 text-sm">
          <dt className="font-semibold text-[#262626]">{label}</dt>
          <dd className="mt-1 break-words text-[#737373]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function toAuditEvent(event: Record<string, unknown>): AuditEvent {
  return {
    action: String(event.action || "case_created") as AuditEvent["action"],
    actor: event.actor ? String(event.actor) : undefined,
    entityId: event.entity_id ? String(event.entity_id) : undefined,
    entityType: event.entity_type ? String(event.entity_type) : undefined,
    metadata: event.metadata && typeof event.metadata === "object" ? (event.metadata as Record<string, unknown>) : undefined,
    createdAt: event.created_at ? String(event.created_at) : undefined,
  };
}

function extractRiskFlags(events: AuditEvent[], handoffRequired: boolean) {
  const flags = events.flatMap((event) => {
    const eventFlags = event.metadata?.flags;
    return Array.isArray(eventFlags) ? eventFlags.map(String) : [];
  });
  return flags.length || !handoffRequired ? flags : ["human_review_required"];
}

function formatAuditAction(action: string) {
  return action
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function auditRows(event: AuditEvent): Array<[string, string]> {
  const metadata = event.metadata || {};
  const rows: Array<[string, string]> = [];

  if (metadata.decision) rows.push(["Policy decision", String(metadata.decision)]);
  if (metadata.severity) rows.push(["Severity", String(metadata.severity)]);
  if (metadata.flags) rows.push(["Risk flags", formatAuditValue(metadata.flags)]);
  if (metadata.reason) rows.push(["Reason", String(metadata.reason)]);
  if (metadata.from || metadata.to) rows.push(["Transition", `${metadata.from || "unknown"} -> ${metadata.to || "unknown"}`]);
  if (metadata.completeness) rows.push(["Completeness", formatCompleteness(metadata.completeness)]);
  if (metadata.extractedFields) rows.push(["Extracted fields", formatExtractedFields(metadata.extractedFields)]);
  if (metadata.handoffRequired !== undefined) rows.push(["Handoff required", metadata.handoffRequired ? "Yes" : "No"]);
  if (metadata.availability) rows.push(["Availability", String(metadata.availability)]);
  if (metadata.appointmentId) rows.push(["Appointment ID", String(metadata.appointmentId)]);
  if (metadata.persisted !== undefined) rows.push(["Persisted", metadata.persisted ? "Yes" : "No"]);
  if (metadata.providerError) rows.push(["Provider error", String(metadata.providerError)]);
  if (metadata.conversationId) rows.push(["Conversation ID", String(metadata.conversationId)]);

  if (rows.length > 0) return rows;

  return Object.entries(metadata)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .slice(0, 6)
    .map(([key, value]) => [formatAuditAction(key), formatAuditValue(value)]);
}

function formatCompleteness(value: unknown) {
  if (!value || typeof value !== "object") return formatAuditValue(value);
  const data = value as Record<string, unknown>;
  const missing = Array.isArray(data.missingFields) ? data.missingFields.map(String).join(", ") : "None";
  return `${String(data.score ?? "unknown")}% complete; missing: ${missing || "None"}`;
}

function formatExtractedFields(value: unknown) {
  if (!value || typeof value !== "object") return formatAuditValue(value);
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, entryValue]) => entryValue !== undefined && entryValue !== null && entryValue !== "",
  );
  if (entries.length === 0) return "None";
  return entries.map(([key, entryValue]) => `${formatAuditAction(key)}: ${formatAuditValue(entryValue)}`).join("; ");
}

function formatAuditValue(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.map(String).join(", ") : "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value);
}
