import { notFound } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { AlertTriangle, CalendarDays, ClipboardList, FileText, UserRound } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CaseStatusControls } from "@/components/admin/CaseStatusControls";
import { ConversationViewer } from "@/components/admin/ConversationViewer";
import { evaluateIntakeCompleteness } from "@/features/intake/domain/intake-completeness";
import type { AuditEvent, IntakeCaseStatus } from "@/features/intake/domain/types";
import { legacyStatusToIntakeStatus, leadToIntakeCase, leadToPatient } from "@/features/intake/infrastructure/legacy-mappers";
import { getLeadBundle } from "@/lib/repository";
import type { ChatMessage } from "@/types/lead";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getLeadBundle(id);
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Intake Case Review</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{patient.name || "Unnamed patient"}</h1>
          <p className="mt-2 text-sm text-slate-400">Case ID {intakeCase.id}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900 px-5 py-4">
          <p className="text-sm text-slate-400">Completeness</p>
          <p className="mt-1 text-3xl font-semibold text-white">{completeness.score}%</p>
          <p className="mt-1 text-xs text-slate-500">
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
          <Panel icon={FileText} title="AI summary">
            <p className="text-sm leading-6 text-slate-400">{intakeCase.summary || "No AI summary has been generated yet."}</p>
          </Panel>

          <Panel icon={CalendarDays} title="Appointment request / history">
            <div className="space-y-3">
              {((bundle.appointments || []) as Array<Record<string, unknown>>).map((appointment) => (
                <div key={String(appointment.id)} className="rounded-lg border border-white/10 bg-slate-950 p-4 text-sm">
                  <p className="font-semibold text-white">{String(appointment.status || "requested")}</p>
                  <p className="mt-1 text-slate-400">
                    {String(appointment.start_time || "No slot selected")} - {String(appointment.end_time || "pending")}
                  </p>
                  <p className="mt-1 text-slate-500">{String(appointment.notes || "No notes")}</p>
                </div>
              ))}
              {(!bundle.appointments || bundle.appointments.length === 0) ? (
                <p className="text-sm text-slate-500">No appointment request has been recorded.</p>
              ) : null}
            </div>
          </Panel>

          <ConversationViewer messages={(bundle.messages || []) as ChatMessage[]} />

          <Panel icon={FileText} title="Internal notes">
            <textarea
              readOnly
              placeholder="Internal notes placeholder for care coordination and operations follow-up."
              className="h-28 w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-300 outline-none"
            />
          </Panel>

          <Panel icon={FileText} title="Audit trail">
            <div className="space-y-3">
              {auditEvents.map((event) => (
                <div key={`${event.action}-${event.createdAt || event.entityId}`} className="border-l border-cyan-300/30 pl-3">
                  <p className="text-sm font-semibold text-white">{event.action}</p>
                  <p className="text-xs text-slate-500">{event.createdAt || "Demo event"}</p>
                </div>
              ))}
              {auditEvents.length === 0 ? <p className="text-sm text-slate-500">No audit events recorded yet.</p> : null}
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
    <section className="rounded-xl border border-white/10 bg-slate-900 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <dt className="font-semibold text-slate-300">{label}</dt>
      <dd className="mt-1 text-slate-500">{value}</dd>
    </div>
  );
}

function toAuditEvent(event: Record<string, unknown>): AuditEvent {
  return {
    action: String(event.action || "case_created") as AuditEvent["action"],
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
