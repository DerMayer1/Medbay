import type { IntakeFields } from "@/features/intake/domain/types";

export type PolicyDecision = "allow" | "block" | "escalate" | "ask_clarifying_question";
export type PolicySeverity = "info" | "warning" | "critical";

export type PolicyEvaluation = {
  decision: PolicyDecision;
  severity: PolicySeverity;
  reason: string;
  handoffRequired: boolean;
  safeResponseHint: string;
  flags: string[];
};

export type PolicyInput = {
  message: string;
  extractedFields?: IntakeFields;
  extractionConfidence?: number;
  wantsScheduling?: boolean;
};

const clinicalAdvicePatterns = [/\bwhat should i do\b/i, /\btreatment advice\b/i, /\bmedical advice\b/i, /\bshould i take\b/i];
const diagnosisPatterns = [/\bdiagnos/i, /\bwhat do i have\b/i, /\bis this cancer\b/i, /\bdo i have\b/i];
const medicationPatterns = [/\bmedication\b/i, /\bprescri/i, /\bantibiotic\b/i, /\bdosage\b/i, /\bpainkiller\b/i];
const examPatterns = [/\blab result/i, /\bblood work\b/i, /\btest result/i, /\bexam interpretation\b/i, /\bmri\b/i, /\bx[-\s]?ray\b/i];
const emergencyPatterns = [/\bchest pain\b/i, /\bshortness of breath\b/i, /\bstroke\b/i, /\bseizure\b/i, /\bsuicid/i, /\bunconscious\b/i];
const humanPatterns = [/\bhuman\b/i, /\bstaff\b/i, /\bperson\b/i, /\brepresentative\b/i, /\bcall me\b/i];

function matches(patterns: RegExp[], message: string) {
  return patterns.some((pattern) => pattern.test(message));
}

export function evaluateIntakePolicy(input: PolicyInput): PolicyEvaluation {
  const flags: string[] = [];
  const message = input.message;

  if (matches(emergencyPatterns, message)) {
    flags.push("emergency_red_flag");
    return {
      decision: "escalate",
      severity: "critical",
      reason: "Emergency red flag detected.",
      handoffRequired: true,
      safeResponseHint:
        "This may be urgent. Please contact emergency services or go to the nearest emergency department. I can also route this to clinic staff.",
      flags,
    };
  }

  if (matches(diagnosisPatterns, message)) flags.push("diagnosis_request");
  if (matches(medicationPatterns, message)) flags.push("medication_request");
  if (matches(examPatterns, message)) flags.push("exam_interpretation_request");
  if (matches(clinicalAdvicePatterns, message)) flags.push("clinical_advice_request");

  if (flags.length > 0) {
    return {
      decision: "block",
      severity: "warning",
      reason: flags.join(", "),
      handoffRequired: true,
      safeResponseHint:
        "I cannot provide diagnosis, medication guidance, clinical advice, or interpret results. I can collect intake details and route this to clinic staff.",
      flags,
    };
  }

  if (matches(humanPatterns, message)) {
    return {
      decision: "escalate",
      severity: "info",
      reason: "Patient requested human staff.",
      handoffRequired: true,
      safeResponseHint: "I will route this intake case to clinic staff for human follow-up.",
      flags: ["human_requested"],
    };
  }

  if (input.wantsScheduling && !input.extractedFields?.contact) {
    return {
      decision: "ask_clarifying_question",
      severity: "info",
      reason: "Scheduling requested before contact information is available.",
      handoffRequired: false,
      safeResponseHint: "Before scheduling, ask for the best contact information for follow-up.",
      flags: ["missing_contact_before_scheduling"],
    };
  }

  if (input.extractionConfidence !== undefined && input.extractionConfidence < 0.5) {
    return {
      decision: "ask_clarifying_question",
      severity: "info",
      reason: "Structured extraction confidence is low.",
      handoffRequired: false,
      safeResponseHint: "Ask one clarifying question to continue intake safely.",
      flags: ["low_confidence_extraction"],
    };
  }

  return {
    decision: "allow",
    severity: "info",
    reason: "No deterministic policy issue detected.",
    handoffRequired: false,
    safeResponseHint: "Continue administrative intake or scheduling support.",
    flags,
  };
}

export function validateAssistantOutputSafety(output: string): PolicyEvaluation {
  return evaluateIntakePolicy({ message: output });
}
