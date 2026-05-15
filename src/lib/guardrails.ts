import { CLINICAL_HANDOFF_REPLY } from "@/lib/constants";
import type { AssistantOutput } from "@/types/assistant";
import type { Intent } from "@/types/lead";

const unsafeClinicalPatterns = [
  /\bdiagnos/i,
  /\bprescri/i,
  /\btreat(ment)? plan\b/i,
  /\bwhat should i take\b/i,
  /\bmedication\b/i,
  /\bantibiotic\b/i,
  /\bpainkiller\b/i,
  /\blab result/i,
  /\bblood work\b/i,
  /\bimaging\b/i,
  /\bmri\b/i,
  /\bx[-\s]?ray\b/i,
  /\bexam interpretation\b/i,
  /\bdiet\b/i,
  /\bmeal plan\b/i,
  /\bsupplement\b/i,
  /\bcreatine\b/i,
  /\bprotein powder\b/i,
  /\bcalorie/i,
  /\bsuicid/i,
  /\bchest pain\b/i,
  /\bshortness of breath\b/i,
];

const complaintPatterns = [/\bcomplain/i, /\bangry\b/i, /\bupset\b/i, /\bterrible\b/i, /\bno one replied\b/i];

export function requiresClinicalHandoff(message: string) {
  return unsafeClinicalPatterns.some((pattern) => pattern.test(message));
}

export function isComplaint(message: string) {
  return complaintPatterns.some((pattern) => pattern.test(message));
}

export function classifyIntent(message: string): Intent {
  const text = message.toLowerCase();

  if (requiresClinicalHandoff(message)) return "clinical_question";
  if (isComplaint(message)) return "complaint";
  if (/\b(human|person|staff|team|representative|call me)\b/i.test(text)) return "human_handoff";
  if (/\b(reschedule|move my appointment|change appointment)\b/i.test(text)) return "reschedule_appointment";
  if (/\b(cancel|delete appointment)\b/i.test(text)) return "cancel_appointment";
  if (/\b(price|pricing|cost|payment|insurance|self pay)\b/i.test(text)) return "ask_pricing";
  if (/\b(location|address|where are you)\b/i.test(text)) return "ask_location";
  if (/\b(service|specialty|specialist|provider|doctor)\b/i.test(text)) return "ask_services";
  if (/\b(hours|open|availability|available)\b/i.test(text)) return "ask_hours";
  if (/\b(schedule|appointment|book|visit|intake|new patient|clinic)\b/i.test(text)) return "patient_intake";

  return "other";
}

export function applyDeterministicGuardrails(message: string, output: AssistantOutput): AssistantOutput {
  const intent = classifyIntent(message);

  if (intent === "clinical_question" || intent === "complaint") {
    return {
      ...output,
      reply: CLINICAL_HANDOFF_REPLY,
      intent,
      leadState: "waiting_human",
      extractedData: { ...output.extractedData, handoffRequired: true },
      handoffRequired: true,
      handoffReason: intent,
      shouldNotifyTeam: true,
      shouldCheckCalendar: false,
      shouldCreateAppointment: false,
    };
  }

  return { ...output, intent: output.intent === "other" ? intent : output.intent };
}
