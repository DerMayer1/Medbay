import { assessClinicalRedFlags } from "@/features/intake/domain/red-flag-detection";
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
// Non-cardiac emergencies stay as literal patterns: they are unambiguous and
// need no qualification. Cardiology red flags are handled by the reviewed
// vocabulary in clinical-red-flags.ts.
const emergencyPatterns = [/\bstroke\b/i, /\bseizure\b/i, /\bsuicid/i, /\boverdose\b/i];
const humanPatterns = [/\bhuman\b/i, /\bstaff\b/i, /\bperson\b/i, /\brepresentative\b/i, /\bcall me\b/i];

function matches(patterns: RegExp[], message: string) {
  return patterns.some((pattern) => pattern.test(message));
}

const OUTPUT_SAFE_RESPONSE_HINT =
  "I cannot provide diagnosis, medication guidance, clinical advice, or interpret results. I can collect intake details and route this to clinic staff.";

const EMERGENCY_RESPONSE_HINT =
  "This may be urgent. Please contact emergency services or go to the nearest emergency department. I can also route this to clinic staff.";

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
      safeResponseHint: EMERGENCY_RESPONSE_HINT,
      flags,
    };
  }

  const redFlags = assessClinicalRedFlags(message);
  if (redFlags.severity === "critical") {
    return {
      decision: "escalate",
      severity: "critical",
      reason: `Clinical red flag detected: ${redFlags.concepts.join(", ")}.`,
      handoffRequired: true,
      safeResponseHint: EMERGENCY_RESPONSE_HINT,
      flags: ["emergency_red_flag", ...redFlags.concepts],
    };
  }
  if (redFlags.severity === "warning") {
    // Review-worthy but not an emergency. Handoff keeps the case out of
    // automatic scheduling without showing emergency guidance.
    return {
      decision: "escalate",
      severity: "warning",
      reason: `Clinical symptom requires human review: ${redFlags.concepts.join(", ")}.`,
      handoffRequired: true,
      safeResponseHint:
        "Thank you for describing that. I will route this to clinic staff so a clinician can review the details before anything is scheduled.",
      flags: ["clinical_review_required", ...redFlags.concepts],
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

/**
 * Validates assistant output before it is persisted.
 *
 * This deliberately does not reuse the patient-triage qualifiers. The question
 * for generated text is whether the model made a clinical assertion at all, not
 * whether a patient is at risk, so negation and history handling must not apply:
 * "you have no chest pain" is still the assistant making a clinical claim it is
 * not permitted to make.
 */
export function validateAssistantOutputSafety(output: string): PolicyEvaluation {
  const flags: string[] = [];

  if (matches(emergencyPatterns, output)) flags.push("emergency_language");
  if (matches(diagnosisPatterns, output)) flags.push("diagnosis_request");
  if (matches(medicationPatterns, output)) flags.push("medication_request");
  if (matches(examPatterns, output)) flags.push("exam_interpretation_request");
  if (matches(clinicalAdvicePatterns, output)) flags.push("clinical_advice_request");

  // Qualifiers are deliberately not applied. "You have no chest pain" is still
  // the assistant asserting a clinical finding it may not assert.
  const asserted = assessClinicalRedFlags(output, { applyQualifiers: false });
  if (asserted.severity) flags.push("assistant_clinical_assertion", ...asserted.concepts);

  if (!flags.length) {
    return {
      decision: "allow",
      severity: "info",
      reason: "Assistant output contains no clinical assertion.",
      handoffRequired: false,
      safeResponseHint: "Continue administrative intake or scheduling support.",
      flags,
    };
  }

  return {
    decision: "block",
    severity: "warning",
    reason: `Assistant output contains a clinical assertion: ${flags.join(", ")}.`,
    handoffRequired: true,
    safeResponseHint: OUTPUT_SAFE_RESPONSE_HINT,
    flags,
  };
}
