import type { IntakeCase, IntakeCaseStatus, IntakeFields, Patient } from "@/features/intake/domain/types";
import type { Lead, LeadState } from "@/types/lead";

export function legacyStatusToIntakeStatus(status?: string): IntakeCaseStatus {
  if (
    status === "opened" ||
    status === "collecting_information" ||
    status === "needs_human_review" ||
    status === "ready_for_scheduling" ||
    status === "appointment_requested" ||
    status === "scheduled" ||
    status === "closed" ||
    status === "discarded"
  ) {
    return status;
  }
  if (status === "qualified") return "ready_for_scheduling";
  if (status === "waiting_human" || status === "human_handoff") return "needs_human_review";
  if (status === "scheduled" || status === "appointment_confirmed") return "scheduled";
  if (status === "resolved" || status === "closed") return "closed";
  if (status === "lost") return "discarded";
  if (status?.startsWith("collecting_")) return "collecting_information";
  return status === "new" ? "opened" : "opened";
}

export function intakeStatusToLegacyStatus(status: IntakeCaseStatus): LeadState {
  const map: Record<IntakeCaseStatus, LeadState> = {
    opened: "new",
    collecting_information: "collecting_name",
    needs_human_review: "waiting_human",
    ready_for_scheduling: "qualified",
    appointment_requested: "qualified",
    scheduled: "scheduled",
    closed: "resolved",
    discarded: "lost",
  };
  return map[status];
}

export function leadToIntakeFields(lead: Partial<Lead>): IntakeFields {
  return {
    patientName: lead.name,
    contact: lead.contact || lead.phone || lead.email,
    email: lead.email,
    phone: lead.phone,
    reasonForVisit: lead.reasonForVisit || lead.reason_for_visit || lead.goal,
    requestedService: lead.preferredService || lead.preferred_service || lead.consultation_type,
    urgencyLevel: lead.urgencyLevel || lead.urgency_level,
    paymentType: lead.paymentType || lead.payment_type,
    availability: lead.availability || lead.schedulePreference || lead.schedule_preference,
  };
}

export function intakeFieldsToLead(fields: IntakeFields): Partial<Lead> {
  return {
    name: fields.patientName,
    contact: fields.contact,
    email: fields.email,
    phone: fields.phone,
    reasonForVisit: fields.reasonForVisit,
    reason_for_visit: fields.reasonForVisit,
    preferredService: fields.requestedService,
    preferred_service: fields.requestedService,
    urgencyLevel: fields.urgencyLevel,
    urgency_level: fields.urgencyLevel,
    paymentType: fields.paymentType,
    payment_type: fields.paymentType,
    availability: fields.availability,
  };
}

export function leadToPatient(lead: Partial<Lead> & { id?: string }): Patient {
  return {
    id: lead.id || "unknown-patient",
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    contact: lead.contact || lead.phone || lead.email,
    createdAt: lead.created_at || lead.createdAt,
    updatedAt: lead.updated_at || lead.updatedAt,
  };
}

export function leadToIntakeCase(
  lead: Partial<Lead> & { id: string },
  conversationId?: string,
): IntakeCase {
  return {
    id: lead.id,
    patientId: lead.id,
    conversationId,
    status: legacyStatusToIntakeStatus(lead.status),
    fields: leadToIntakeFields(lead),
    handoffRequired: Boolean(lead.handoffRequired || lead.handoff_required),
    handoffReason: lead.intent,
    summary: lead.summary,
    source: lead.source || "landing_page",
    createdAt: lead.created_at || lead.createdAt,
    updatedAt: lead.updated_at || lead.updatedAt,
  };
}
