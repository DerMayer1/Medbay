import { createCalendarEvent } from "@/lib/calendar";
import { notifyTeam } from "@/lib/email";
import { extractLeadByState } from "@/lib/extraction";
import { generateAssistantResponse } from "@/lib/openai";
import { buildKnowledgeContext } from "@/lib/prompts";
import {
  createAppointmentRecord,
  ensureConversation,
  getActiveKnowledge,
  getLeadBundle,
  getLeadForConversation,
  getRecentMessages,
  listLeads,
  saveMessage,
  updateConversationStatus,
  upsertLeadForConversation,
  writeAuditLog,
} from "@/lib/repository";
import type { AssistantInput } from "@/types/assistant";
import type { ChatMessage, LeadState } from "@/types/lead";
import type { IntakeUseCaseDependencies } from "@/features/intake/application/ports";
import type {
  Appointment,
  AuditEvent,
  Conversation,
  IntakeCase,
  IntakeFields,
  KnowledgeBaseItem,
  Message,
  Patient,
} from "@/features/intake/domain/types";
import {
  intakeFieldsToLead,
  intakeStatusToLegacyStatus,
  leadToIntakeCase,
  leadToPatient,
} from "@/features/intake/infrastructure/legacy-mappers";

function currentCollectionState(fields: IntakeFields): LeadState {
  if (!fields.patientName) return "collecting_name";
  if (!fields.contact) return "collecting_contact";
  if (!fields.reasonForVisit) return "collecting_reason";
  if (!fields.requestedService) return "collecting_service";
  if (!fields.urgencyLevel) return "collecting_urgency";
  if (!fields.availability) return "collecting_availability";
  if (!fields.paymentType) return "collecting_payment";
  return "qualified";
}

function messageToDomain(message: ChatMessage): Message {
  return message;
}

class RepositoryBackedAdapters implements IntakeUseCaseDependencies {
  caseRepository = {
    findByConversationId: async (conversationId: string) => {
      const lead = await getLeadForConversation(conversationId);
      return lead?.id ? leadToIntakeCase(lead as { id: string }, conversationId) : null;
    },
    save: async (intakeCase: IntakeCase) => {
      const lead = await upsertLeadForConversation(intakeCase.conversationId || crypto.randomUUID(), {
        id: intakeCase.id,
        ...intakeFieldsToLead(intakeCase.fields),
        status: intakeStatusToLegacyStatus(intakeCase.status),
        handoffRequired: intakeCase.handoffRequired,
        handoff_required: intakeCase.handoffRequired,
        intent: intakeCase.handoffReason === "clinical_question" ? "clinical_question" : undefined,
        summary: intakeCase.summary,
        source: intakeCase.source,
      });
      return leadToIntakeCase(lead as { id: string }, intakeCase.conversationId);
    },
    list: async () => {
      const leads = await listLeads();
      return leads.filter((lead) => lead.id).map((lead) => leadToIntakeCase(lead as { id: string }));
    },
    getReviewBundle: async (id: string) => {
      const bundle = await getLeadBundle(id);
      if (!bundle.lead?.id) return null;
      return {
        patient: leadToPatient(bundle.lead),
        intakeCase: leadToIntakeCase(bundle.lead as { id: string }, bundle.conversation?.id as string | undefined),
        messages: ((bundle.messages || []) as ChatMessage[]).map(messageToDomain),
        appointments: ((bundle.appointments || []) as Array<Record<string, unknown>>).map((appointment) => ({
          id: String(appointment.id),
          intakeCaseId: String(appointment.lead_id || id),
          startTime: appointment.start_time ? String(appointment.start_time) : undefined,
          endTime: appointment.end_time ? String(appointment.end_time) : undefined,
          status: String(appointment.status || "requested") as Appointment["status"],
          modality: appointment.modality ? String(appointment.modality) : undefined,
          externalCalendarEventId: appointment.google_event_id ? String(appointment.google_event_id) : undefined,
          notes: appointment.notes ? String(appointment.notes) : undefined,
        })),
        auditEvents: ((bundle.auditEvents || []) as Array<Record<string, unknown>>).map((event) => ({
          action: String(event.action || "case_created") as AuditEvent["action"],
          actor: event.actor ? String(event.actor) : undefined,
          entityType: event.entity_type ? String(event.entity_type) : undefined,
          entityId: event.entity_id ? String(event.entity_id) : undefined,
          metadata: event.metadata && typeof event.metadata === "object" ? (event.metadata as Record<string, unknown>) : undefined,
          createdAt: event.created_at ? String(event.created_at) : undefined,
        })),
      };
    },
  };

  patientRepository = {
    loadOrCreatePatient: async (input: { visitorId: string; fields?: IntakeFields }): Promise<Patient> => ({
      id: input.visitorId,
      name: input.fields?.patientName,
      email: input.fields?.email,
      phone: input.fields?.phone,
      contact: input.fields?.contact,
    }),
  };

  conversationRepository = {
    loadOrCreateConversation: async (input: { conversationId: string; visitorId: string; source?: string }) => {
      await ensureConversation(input.conversationId, input.visitorId, input.source);
      return { id: input.conversationId, visitorId: input.visitorId };
    },
    saveMessage: async (input: {
      conversationId: string;
      role: "user" | "assistant";
      content: string;
      metadata?: Record<string, unknown>;
    }) => messageToDomain(await saveMessage(input.conversationId, input.role, input.content, input.metadata || {})),
    getRecentMessages: async (conversationId: string, limit?: number) =>
      (await getRecentMessages(conversationId, limit)).map(messageToDomain),
    updateStatus: async (
      conversationId: string,
      input: Partial<Conversation> & { handoffReason?: string; summary?: string },
    ) => {
      await updateConversationStatus(conversationId, {
        status: input.status,
        handoff_required: input.status === "needs_human_review",
        handoff_reason: input.handoffReason,
        summary: input.summary,
      });
    },
  };

  knowledgeBaseRepository = {
    listActive: getActiveKnowledge,
  };

  auditLogger = {
    record: async (event: AuditEvent) => {
      await writeAuditLog({
        actor: event.actor,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata,
      });
    },
  };

  aiProvider = {
    generateResponse: async (input: AssistantInput) => generateAssistantResponse(input),
  };

  notificationProvider = {
    notifyIntakeEvent: async (input: { subject: string; intakeCase: IntakeCase; summary?: string }) =>
      notifyTeam(
        input.subject,
        {
          id: input.intakeCase.id,
          ...intakeFieldsToLead(input.intakeCase.fields),
          status: intakeStatusToLegacyStatus(input.intakeCase.status),
          source: input.intakeCase.source,
          summary: input.intakeCase.summary,
        },
        input.summary,
      ),
  };

  calendarProvider = {
    requestAppointment: async (input: { intakeCaseId: string; preferredTime?: string; notes?: string }): Promise<Appointment> => {
      const startTime = input.preferredTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const endTime = new Date(new Date(startTime).getTime() + 45 * 60 * 1000).toISOString();
      const status: Appointment["status"] = "requested";
      const event = await createCalendarEvent({
        summary: "Northstar Clinic appointment request",
        description: input.notes,
        startTime,
        endTime,
      });
      const appointment = await createAppointmentRecord({
        lead_id: input.intakeCaseId,
        start_time: startTime,
        end_time: endTime,
        status,
        google_event_id: event.googleEventId,
        notes: input.notes,
      });
      return {
        id: String(appointment.id),
        intakeCaseId: input.intakeCaseId,
        startTime,
        endTime,
        status,
        externalCalendarEventId: event.googleEventId,
        notes: input.notes,
      };
    },
  };
}

export function mapExtractedLeadToIntakeFields(message: string, fields: IntakeFields): IntakeFields {
  const extracted = extractLeadByState(message, currentCollectionState(fields));
  return {
    patientName: extracted.name,
    contact: extracted.contact || extracted.phone || extracted.email,
    email: extracted.email,
    phone: extracted.phone,
    reasonForVisit: extracted.reasonForVisit || extracted.reason_for_visit,
    requestedService: extracted.preferredService || extracted.preferred_service,
    urgencyLevel: extracted.urgencyLevel || extracted.urgency_level,
    paymentType: extracted.paymentType || extracted.payment_type,
    availability: extracted.availability,
  };
}

export function mergeIntakeFields(existing: IntakeFields, extracted: IntakeFields): IntakeFields {
  return {
    ...existing,
    ...Object.fromEntries(
      Object.entries(extracted).filter(([, value]) => value !== undefined && value !== "" && value !== "unknown"),
    ),
  };
}

export function buildAiInput(input: {
  message: string;
  messages: Message[];
  knowledge: string;
  fields: IntakeFields;
}) {
  return {
    message: input.message,
    messages: input.messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({ role: message.role as "user" | "assistant", content: message.content })),
    knowledge: input.knowledge,
    currentLeadState: currentCollectionState(input.fields),
  };
}

export function buildKnowledgeContextFromItems(items: KnowledgeBaseItem[]) {
  return buildKnowledgeContext(items);
}

export function createIntakeUseCaseDependencies(): IntakeUseCaseDependencies {
  return new RepositoryBackedAdapters();
}
