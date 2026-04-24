import type { AssistantOutput } from "@/types/assistant";
import type { Lead, LeadState } from "@/types/lead";

const scheduleFlow: LeadState[] = [
  "collecting_name",
  "collecting_consultation_type",
  "collecting_goal",
  "collecting_modality",
  "collecting_schedule_preference",
  "collecting_contact",
  "ready_for_human_confirmation",
];

export function hasQualifiedLeadData(lead: Partial<Lead>) {
  return Boolean(
    lead.name &&
      (lead.consultationType || lead.consultation_type) &&
      lead.goal &&
      lead.modality &&
      (lead.schedulePreference || lead.schedule_preference) &&
      (lead.phone || lead.email),
  );
}

export function getNextLeadState(current: LeadState, lead: Partial<Lead>, intent?: string): LeadState {
  if (intent === "human_handoff" || intent === "clinical_question" || intent === "complaint") {
    return "human_handoff";
  }

  if (hasQualifiedLeadData(lead)) return "ready_for_human_confirmation";

  if (intent !== "schedule_appointment" && current === "new") return "chatting";

  if (!lead.name) return "collecting_name";
  if (!(lead.consultationType || lead.consultation_type)) return "collecting_consultation_type";
  if (!lead.goal) return "collecting_goal";
  if (!lead.modality || lead.modality === "unknown") return "collecting_modality";
  if (!(lead.schedulePreference || lead.schedule_preference)) return "collecting_schedule_preference";
  if (!(lead.phone || lead.email)) return "collecting_contact";

  const currentIndex = scheduleFlow.indexOf(current);
  return currentIndex >= 0 ? scheduleFlow[Math.min(currentIndex + 1, scheduleFlow.length - 1)] : "chatting";
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
