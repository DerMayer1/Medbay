import { demoAppointments, demoConversations, demoKnowledge, demoLeads } from "@/lib/demoData";
import type { KnowledgeItem, Lead } from "@/types/lead";
import { assertBriefCanBeApproved, isPreConsultationBrief } from "@/features/briefs/domain/pre-consultation-brief";

type DemoAppointment = (typeof demoAppointments)[number];
type DemoConversation = (typeof demoConversations)[number];
type DemoAuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type DemoStore = {
  leads: Array<Lead & { notes?: string; pre_consultation_brief?: unknown }>;
  conversations: DemoConversation[];
  appointments: DemoAppointment[];
  knowledge: KnowledgeItem[];
  auditEvents: DemoAuditEvent[];
};

const globalForDemo = globalThis as typeof globalThis & { __medbayDemoStore?: DemoStore };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function timestamp() {
  return new Date().toISOString();
}

function createInitialAuditEvents(leads: DemoStore["leads"]): DemoAuditEvent[] {
  return leads.flatMap((lead) => {
    const createdAt = String(lead.created_at || timestamp());
    const handoffRequired = Boolean(lead.handoff_required);

    const events: DemoAuditEvent[] = [
      {
        id: crypto.randomUUID(),
        actor: "system",
        action: "policy_evaluated",
        entity_type: "intake_case",
        entity_id: lead.id,
        metadata: handoffRequired
          ? { decision: "block", severity: "warning", flags: ["exam_interpretation_request"] }
          : { decision: "allow", severity: "info", flags: [] },
        created_at: createdAt,
      },
      {
        id: crypto.randomUUID(),
        actor: "system",
        action: "intake_extracted",
        entity_type: "intake_case",
        entity_id: lead.id,
        metadata: {
          extractedFields: {
            patientName: lead.name,
            contact: lead.contact,
            reasonForVisit: lead.reason_for_visit,
            requestedService: lead.preferred_service,
            urgencyLevel: lead.urgency_level,
            paymentType: lead.payment_type,
            availability: lead.availability,
          },
          completeness: { score: 100, missingFields: [], readyForScheduling: true },
        },
        created_at: createdAt,
      },
      {
        id: crypto.randomUUID(),
        actor: "system",
        action: handoffRequired ? "handoff_requested" : "appointment_requested",
        entity_type: "intake_case",
        entity_id: lead.id,
        metadata: handoffRequired
          ? { reason: "exam_interpretation_request", severity: "warning" }
          : { availability: lead.availability, appointmentId: demoAppointments[0]?.id, persisted: true },
        created_at: createdAt,
      },
    ];

    if (lead.pre_consultation_brief) {
      events.push({
        id: crypto.randomUUID(),
        actor: "system",
        action: "brief_generated",
        entity_type: "intake_case",
        entity_id: lead.id,
        metadata: { reviewStatus: lead.brief_review_status, provenanceRequired: true },
        created_at: createdAt,
      });
    }

    return events;
  });
}

function getStore() {
  if (!globalForDemo.__medbayDemoStore) {
    const leads = clone(demoLeads) as DemoStore["leads"];
    globalForDemo.__medbayDemoStore = {
      leads,
      conversations: clone(demoConversations),
      appointments: clone(demoAppointments),
      knowledge: clone(demoKnowledge) as KnowledgeItem[],
      auditEvents: createInitialAuditEvents(leads),
    };
  }

  return globalForDemo.__medbayDemoStore;
}

function getLeadOrDefault(id: string) {
  const store = getStore();
  return store.leads.find((item) => item.id === id) || store.leads[0];
}

function getConversationForLead(leadId: string) {
  const store = getStore();
  return store.conversations.find((item) => item.lead_id === leadId) || store.conversations[0];
}

export function listDemoLeads() {
  return clone(getStore().leads);
}

export function listDemoConversations() {
  return clone(getStore().conversations);
}

export function listDemoAppointments() {
  return clone(getStore().appointments);
}

export function listDemoKnowledge() {
  return clone(getStore().knowledge);
}

export function getDemoLeadBundle(id: string) {
  const store = getStore();
  const lead = getLeadOrDefault(id);
  const conversation = getConversationForLead(lead.id);
  const leadAppointments = store.appointments.filter((appointment) => appointment.lead_id === lead.id);
  const auditEvents = store.auditEvents.filter(
    (event) => event.entity_id === lead.id || event.metadata.caseId === lead.id,
  );

  return clone({
    lead,
    conversation,
    messages: [
      {
        id: "66666666-6666-4666-8666-666666666666",
        conversation_id: conversation.id,
        role: "user",
        content: lead.reason_for_visit,
        metadata: {},
        created_at: lead.created_at,
      },
      {
        id: "77777777-7777-4777-8777-777777777777",
        conversation_id: conversation.id,
        role: "assistant",
        content: lead.handoff_required
          ? "I cannot interpret results. I can route this to clinic staff for review."
          : "I have the core intake details and can route this for scheduling review.",
        metadata: { caseStatus: lead.status, handoffRequired: lead.handoff_required },
        created_at: lead.updated_at,
      },
    ],
    appointments: leadAppointments,
    auditEvents,
  });
}

export function createDemoKnowledgeItem(input: Omit<KnowledgeItem, "id">) {
  const store = getStore();
  const item = {
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp(),
    updated_at: timestamp(),
  } as KnowledgeItem;
  store.knowledge.unshift(item);
  return clone(item);
}

export function updateDemoKnowledgeItem(id: string, input: Partial<KnowledgeItem>) {
  const store = getStore();
  const index = store.knowledge.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Demo knowledge item was not found.");

  const updated = { ...store.knowledge[index], ...input, id, updated_at: timestamp() };
  store.knowledge[index] = updated;
  return clone(updated);
}

export function createDemoAppointment(input: Record<string, unknown>) {
  const store = getStore();
  const appointment = {
    ...clone(demoAppointments[0]),
    ...input,
    id: crypto.randomUUID(),
    created_at: timestamp(),
    updated_at: timestamp(),
  } as DemoAppointment;
  store.appointments.unshift(appointment);
  return clone(appointment);
}

export function updateDemoLeadRecord(id: string, input: Partial<Lead> & { notes?: string }) {
  const store = getStore();
  const index = store.leads.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Demo intake case was not found.");

  const previous = store.leads[index];
  const updated = {
    ...previous,
    ...input,
    updated_at: timestamp(),
  };
  store.leads[index] = updated;

  store.conversations = store.conversations.map((conversation) =>
    conversation.lead_id === id
      ? {
          ...conversation,
          status: String(updated.status || conversation.status),
          handoff_required: Boolean(updated.handoff_required),
          summary: updated.summary || conversation.summary,
          updated_at: updated.updated_at,
        }
      : conversation,
  );

  const action = input.notes !== undefined
    ? "internal_note_updated"
    : input.brief_review_status === "approved"
      ? "brief_approved"
      : input.brief_review_status === "rejected"
        ? "brief_rejected"
        : input.brief_review_status === "needs_review"
          ? "brief_review_requested"
          : input.status
            ? "status_changed"
            : "intake_case_updated";
  store.auditEvents.push({
    id: crypto.randomUUID(),
    actor: "demo_user",
    action,
    entity_type: "intake_case",
    entity_id: id,
    metadata: input.status
      ? { from: previous.status, to: input.status }
      : input.brief_review_status
        ? { from: previous.brief_review_status || "draft", to: input.brief_review_status }
        : input.notes !== undefined
          ? { noteLength: input.notes.length }
          : input,
    created_at: updated.updated_at,
  });

  return clone(updated);
}

export function reviewDemoBriefVersion(input: {
  caseId: string;
  versionId: string;
  expectedContentSha256: string;
  decision: "approved" | "rejected";
  reason: string;
  reviewer: { id: string; name: string };
}) {
  const store = getStore();
  const index = store.leads.findIndex((lead) => lead.id === input.caseId);
  if (index < 0) throw new Error("Synthetic case was not found.");
  const current = store.leads[index];
  if (!isPreConsultationBrief(current.pre_consultation_brief)) throw new Error("No valid brief version is available.");
  const brief = current.pre_consultation_brief;
  if (brief.versionId !== input.versionId) throw new Error("Brief version does not belong to this case.");
  if (brief.contentSha256 !== input.expectedContentSha256) throw new Error("Brief content changed. Reload before reviewing.");
  if (brief.status !== "needs_review") throw new Error("This brief version already has a final decision.");
  if (input.decision === "approved") assertBriefCanBeApproved(brief);

  const reviewedAt = timestamp();
  const reviewed = {
    ...brief,
    status: input.decision,
    review: { reviewerId: input.reviewer.id, reviewerName: input.reviewer.name, decision: input.decision, reason: input.reason, reviewedAt },
  };
  store.leads[index] = { ...current, brief_review_status: input.decision, pre_consultation_brief: reviewed, brief_reviewed_by: input.reviewer.id, brief_reviewed_at: reviewedAt, updated_at: reviewedAt };
  store.auditEvents.push({
    id: crypto.randomUUID(), actor: input.reviewer.name, action: `brief_${input.decision}`, entity_type: "brief_version", entity_id: input.versionId,
    metadata: { caseId: input.caseId, contentSha256: input.expectedContentSha256, reason: input.reason }, created_at: reviewedAt,
  });
  return clone(reviewed);
}
