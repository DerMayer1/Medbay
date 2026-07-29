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
import { PreConsultationBriefReview } from "@/components/admin/PreConsultationBriefReview";
import { SourceDocumentUploader } from "@/components/admin/SourceDocumentUploader";
import { isPreConsultationBrief } from "@/features/briefs/domain/pre-consultation-brief";
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
  const preConsultationBrief = isPreConsultationBrief(bundle.lead.pre_consultation_brief)
    ? bundle.lead.pre_consultation_brief
    : null;

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="medbay-label">Visit preparation review</p>
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

          <SourceDocumentUploader caseId={intakeCase.id} hasBrief={Boolean(preConsultationBrief)} />

          {preConsultationBrief ? (
            <PreConsultationBriefReview caseId={intakeCase.id} brief={preConsultationBrief} />
          ) : (
            <Panel icon={FileText} title="Pre-consultation brief">
              <p className="text-sm leading-6 text-[#737373]">
                No source-linked brief is available. Staff must collect and identify the required records before physician review.
              </p>
            </Panel>
          )}

          <Panel icon={FileText} title="Administrative intake summary">
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
            <InternalNotesEditor caseId={intakeCase.id} initialNotes={String(bundle.lead.notes || "")} />
          </Panel>

          <Panel icon={FileText} title="Audit trail">
            <AuditTrail auditEvents={auditEvents} />
          </Panel>
        </section>
      </div>
    </AdminLayout>
  );
}

function CaseDecisionPanel({
  intakeCase,
  auditEvents,
  riskFlags,
}: {
  intakeCase: IntakeCase;
  auditEvents: AuditEvent[];
  riskFlags: string[];
}) {
  const policyEvent = auditEvents.find((event) => event.action === "policy_evaluated");
  const decision = String(policyEvent?.metadata?.decision || (intakeCase.handoffRequired ? "escalate" : "allow"));
  const severity = String(policyEvent?.metadata?.severity || (intakeCase.handoffRequired ? "warning" : "info"));
  const tone = decisionTone(decision, severity);
  const nextAction = getNextAction(intakeCase, decision);

  return (
    <section className={`overflow-hidden rounded-xl border ${tone.border} ${tone.bg}`}>
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone.iconBg} ${tone.iconText}`}>
            {intakeCase.handoffRequired ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <p className="medbay-label">Case decision</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#262626]">{tone.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#737373]">{tone.description}</p>
          </div>
        </div>

        <div className="grid min-w-[230px] gap-2 text-sm">
          <Signal label="Policy" value={formatAuditAction(decision)} tone={tone.pill} />
          <Signal label="Severity" value={formatAuditAction(severity)} tone={severity === "warning" ? "warning" : tone.pill} />
          <Signal label="Next action" value={nextAction} tone="blue" />
        </div>
      </div>

      <div className="grid border-t border-black/5 bg-white/60 md:grid-cols-3">
        <DecisionMetric label="Risk flags" value={riskFlags.length ? riskFlags.join(", ") : "None detected"} />
        <DecisionMetric label="Case status" value={intakeCase.status} />
        <DecisionMetric label="Handoff" value={intakeCase.handoffRequired ? "Required" : "Not required"} />
      </div>
    </section>
  );
}

function CaseTimeline({ intakeCase, auditEvents }: { intakeCase: IntakeCase; auditEvents: AuditEvent[] }) {
  const steps = [
    timelineStep("Message received", auditEvents.find((event) => event.action === "message_received"), true),
    timelineStep("Policy evaluated", auditEvents.find((event) => event.action === "policy_evaluated"), true),
    timelineStep("Fields extracted", auditEvents.find((event) => event.action === "intake_extracted"), true),
    timelineStep("Brief prepared", auditEvents.find((event) => event.action === "brief_generated"), false),
    timelineStep(
      intakeCase.handoffRequired ? "Human review requested" : "Appointment requested",
      auditEvents.find((event) => event.action === "handoff_requested" || event.action === "appointment_requested"),
      intakeCase.handoffRequired || intakeCase.status === "appointment_requested" || intakeCase.status === "ready_for_scheduling",
    ),
  ];

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]">
            <Route className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold text-[#262626]">Case timeline</h2>
            <p className="mt-1 text-xs text-[#737373]">Operational path from patient message to staff action.</p>
          </div>
        </div>
        <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">{intakeCase.status}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.label} className="relative rounded-xl border border-[#ededed] bg-[#fafafa] p-4">
            <div className="flex items-start gap-3">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${step.done ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#f5f5f5] text-[#a3a3a3]"}`}>
                {step.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a3a3a3]">Step {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-[#262626]">{step.label}</p>
                <p className="mt-2 break-words text-xs leading-5 text-[#737373]">{step.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditTrail({ auditEvents }: { auditEvents: AuditEvent[] }) {
  if (auditEvents.length === 0) return <p className="text-sm text-[#737373]">No audit events recorded yet.</p>;

  return (
    <div className="relative space-y-4 pl-5 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-px before:bg-[#dbeafe]">
      {auditEvents.map((event) => {
        const tone = auditTone(event);
        return (
          <div key={`${event.action}-${event.createdAt || event.entityId}`} className="relative">
            <span className={`absolute -left-5 top-4 h-3 w-3 rounded-full ring-4 ring-white ${tone.dot}`} />
            <div className={`rounded-xl border ${tone.border} bg-[#ffffff] p-4`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#262626]">{formatAuditAction(event.action)}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.pill}`}>
                      {auditEventLabel(event)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#737373]">{event.createdAt || "Timestamp unavailable"}</p>
                </div>
                {event.actor ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-2.5 py-1 text-xs font-semibold text-[#525252]">
                    <UserCheck className="h-3 w-3" />
                    {event.actor}
                  </span>
                ) : null}
              </div>
              <AuditMetadata event={event} />
            </div>
          </div>
        );
      })}
    </div>
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

function Signal({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "warning" | "red" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/80 bg-white/80 px-3 py-2">
      <span className="text-xs font-medium text-[#737373]">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pillClass(tone)}`}>{value}</span>
    </div>
  );
}

function DecisionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[#ededed] px-5 py-4 md:border-l md:border-t-0">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#262626]">{value}</p>
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

function decisionTone(decision: string, severity: string) {
  if (decision === "block" || severity === "critical") {
    return {
      bg: "bg-[#0d1424]/92",
      border: "border-[#60a5fa]/45",
      iconBg: "bg-[#1e3a5f]",
      iconText: "text-[#bfdbfe]",
      pill: "red" as const,
      title: "Clinical boundary held",
      description:
        "The assistant stopped short of clinical interpretation and preserved the case for staff review with the reason attached.",
    };
  }

  if (decision === "escalate" || severity === "warning") {
    return {
      bg: "bg-[#0b1324]/92",
      border: "border-[#3b82f6]/45",
      iconBg: "bg-[#172f55]",
      iconText: "text-[#93c5fd]",
      pill: "warning" as const,
      title: "Human review required",
      description: "The case contains a signal that should be handled by clinic staff before the patient receives next steps.",
    };
  }

  return {
    bg: "bg-[#071529]/92",
    border: "border-[#3b82f6]/45",
    iconBg: "bg-[#10264a]",
    iconText: "text-[#93c5fd]",
    pill: "green" as const,
    title: "Ready for operational follow-up",
    description: "The request stayed inside administrative scope and has enough structured context for the operations team.",
  };
}

function getNextAction(intakeCase: IntakeCase, decision: string) {
  if (intakeCase.handoffRequired || decision === "block" || decision === "escalate") return "Review with staff";
  if (intakeCase.status === "ready_for_scheduling") return "Offer appointment slot";
  if (intakeCase.status === "appointment_requested") return "Confirm scheduling";
  if (intakeCase.status === "scheduled") return "Prepare visit";
  return "Continue intake";
}

function timelineStep(label: string, event: AuditEvent | undefined, expected: boolean) {
  return {
    label,
    done: Boolean(event || expected),
    detail: event?.createdAt ? event.createdAt : expected ? "Expected in this workflow" : "Waiting for next action",
  };
}

function auditTone(event: AuditEvent) {
  const severity = String(event.metadata?.severity || "");
  const decision = String(event.metadata?.decision || "");

  if (decision === "block" || severity === "critical") {
    return { border: "border-[#60a5fa]/45", dot: "bg-[#60a5fa]", pill: pillClass("red") };
  }

  if (event.action === "handoff_requested" || decision === "escalate" || severity === "warning") {
    return { border: "border-[#3b82f6]/45", dot: "bg-[#3b82f6]", pill: pillClass("warning") };
  }

  if (event.action === "appointment_requested" || event.action === "intake_extracted") {
    return { border: "border-[#bfdbfe]", dot: "bg-[#3b82f6]", pill: pillClass("blue") };
  }

  return { border: "border-[#dcfce7]", dot: "bg-[#22c55e]", pill: pillClass("green") };
}

function auditEventLabel(event: AuditEvent) {
  const decision = event.metadata?.decision;
  const severity = event.metadata?.severity;
  if (decision) return formatAuditAction(String(decision));
  if (severity) return formatAuditAction(String(severity));
  if (event.action === "appointment_requested") return "Scheduling";
  if (event.action === "intake_extracted") return "Structured";
  if (event.action === "handoff_requested") return "Handoff";
  return "Recorded";
}

function pillClass(tone: "blue" | "green" | "warning" | "red") {
  if (tone === "red") return "bg-[#172f55] text-[#bfdbfe]";
  if (tone === "warning") return "bg-[#10264a] text-[#93c5fd]";
  if (tone === "green") return "bg-[#10264a] text-[#93c5fd]";
  return "bg-[#dbeafe] text-[#1d4ed8]";
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
