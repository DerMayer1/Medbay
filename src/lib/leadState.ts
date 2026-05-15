import type { AssistantOutput } from "@/types/assistant";
import type { Lead, LeadState } from "@/types/lead";

export const leadStatuses: LeadState[] = ["new", "qualified", "waiting_human", "scheduled", "lost", "resolved"];

const intakeFlow: LeadState[] = [
  "collecting_name",
  "collecting_contact",
  "collecting_reason",
  "collecting_service",
  "collecting_urgency",
  "collecting_availability",
  "collecting_payment",
  "qualified",
];

export function hasQualifiedLeadData(lead: Partial<Lead>) {
  return Boolean(
    lead.name &&
      (lead.contact || lead.phone || lead.email) &&
      (lead.reasonForVisit || lead.reason_for_visit || lead.goal) &&
      (lead.preferredService || lead.preferred_service || lead.consultation_type) &&
      (lead.urgencyLevel || lead.urgency_level) &&
      lead.availability &&
      (lead.paymentType || lead.payment_type),
  );
}

export function getNextLeadState(current: LeadState, lead: Partial<Lead>, intent?: string): LeadState {
  if (intent === "human_handoff" || intent === "clinical_question" || intent === "complaint" || lead.handoffRequired) {
    return "waiting_human";
  }

  if (hasQualifiedLeadData(lead)) return "qualified";

  if (intent !== "patient_intake" && intent !== "schedule_appointment" && current === "new") return "new";

  if (!lead.name) return "collecting_name";
  if (!(lead.contact || lead.phone || lead.email)) return "collecting_contact";
  if (!(lead.reasonForVisit || lead.reason_for_visit || lead.goal)) return "collecting_reason";
  if (!(lead.preferredService || lead.preferred_service || lead.consultation_type)) return "collecting_service";
  if (!(lead.urgencyLevel || lead.urgency_level)) return "collecting_urgency";
  if (!lead.availability && !(lead.schedulePreference || lead.schedule_preference)) return "collecting_availability";
  if (!(lead.paymentType || lead.payment_type)) return "collecting_payment";

  const currentIndex = intakeFlow.indexOf(current);
  return currentIndex >= 0 ? intakeFlow[Math.min(currentIndex + 1, intakeFlow.length - 1)] : "new";
}

export function mergeLeadData(existing: Partial<Lead>, extracted: Partial<Lead>) {
  return {
    ...existing,
    ...Object.fromEntries(
      Object.entries(extracted).filter(([, value]) => value !== undefined && value !== "" && value !== "unknown"),
    ),
  } as Partial<Lead>;
}

export function normalizeAssistantLeadState(output: AssistantOutput, current: LeadState, lead: Partial<Lead>) {
  return getNextLeadState(current, mergeLeadData(lead, output.extractedData), output.intent);
}
