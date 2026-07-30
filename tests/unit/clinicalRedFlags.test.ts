import { describe, expect, it } from "vitest";
import { evaluateIntakePolicy, validateAssistantOutputSafety } from "@/features/intake/domain/policy-engine";
import { assessClinicalRedFlags } from "@/features/intake/domain/red-flag-detection";
import { decideNextIntakeStatus } from "@/features/intake/domain/intake-workflow";
import { evaluateIntakeCompleteness } from "@/features/intake/domain/intake-completeness";

/**
 * Regression suite for issue #3. Fixtures and expected severities were
 * specified by @goktugozkanmd; see the issue thread for the clinical rationale.
 */
function evaluate(message: string) {
  return evaluateIntakePolicy({
    message,
    wantsScheduling: true,
    extractedFields: { contact: "patient@example.com" } as never,
  });
}

const isEmergency = (message: string) => evaluate(message).flags.includes("emergency_red_flag");

describe("issue #3 — original reporter fixtures", () => {
  it("escalates a scheduling request that carries cardiac symptoms", () => {
    const result = evaluate("I need to book today. My chest is tight and I am short of breath. Call me at 555-0100.");
    expect(result.severity).toBe("critical");
    expect(result.decision).toBe("escalate");
    expect(result.handoffRequired).toBe(true);
    expect(result.flags).toContain("emergency_red_flag");
    expect(result.safeResponseHint).toMatch(/emergency/i);
  });

  it("escalates the same message without the contact request", () => {
    // The original defect: without "call me" this returned allow and could
    // progress to scheduling.
    const result = evaluate("I need to book today. My chest is tight and I am short of breath.");
    expect(result.severity).toBe("critical");
    expect(result.handoffRequired).toBe(true);
  });

  it("blocks a scheduling request bundled with a medication question", () => {
    const result = evaluate("Can you schedule me and tell me whether I should double my blood pressure medication?");
    expect(result.decision).toBe("block");
    expect(result.handoffRequired).toBe(true);
    expect(result.flags).toContain("medication_request");
  });
});

describe("issue #3 — clinical review controls", () => {
  it("keeps recent symptoms critical even when they have stopped", () => {
    const result = evaluate("I had chest pain five minutes ago, but it stopped.");
    expect(result.severity).toBe("critical");
  });

  it("downgrades clearly remote and resolved symptoms to review", () => {
    const result = evaluate("I had chest pain last week and none since.");
    expect(result.severity).toBe("warning");
    expect(result.handoffRequired).toBe(true);
    expect(result.flags).not.toContain("emergency_red_flag");
    expect(result.safeResponseHint).not.toMatch(/emergency/i);
  });

  it("does not raise a red flag on explicit denial", () => {
    const result = evaluate("I have no chest pain or shortness of breath.");
    expect(result.flags).not.toContain("emergency_red_flag");
    expect(result.severity).not.toBe("critical");
  });

  it("does not treat medical history as a current emergency", () => {
    const result = evaluate("History of angina; calling to schedule routine follow-up.");
    expect(isEmergency("History of angina; calling to schedule routine follow-up.")).toBe(false);
    expect(result.severity).not.toBe("critical");
  });
});

describe("expanded symptom vocabulary", () => {
  const criticalPhrases = [
    "There is squeezing in my chest.",
    "I have chest heaviness.",
    "My chest feels heavy.",
    "I feel pressure in my chest.",
    "I cannot catch my breath.",
    "I can't catch my breath.",
    "It is hard to breathe.",
    "I am struggling to breathe.",
    "Breathing feels difficult.",
  ];

  it.each(criticalPhrases)("treats %j as critical", (phrase) => {
    expect(evaluate(phrase).severity).toBe("critical");
  });

  it("expands contractions before matching", () => {
    expect(evaluate("I can't breathe.").severity).toBe("critical");
    expect(evaluate("I cannot breathe.").severity).toBe("critical");
  });
});

describe("nonspecific findings", () => {
  const nonspecific = [
    "I have been getting palpitations.",
    "My jaw has been hurting.",
    "I have some arm pain.",
  ];

  it.each(nonspecific)("routes %j to review rather than emergency", (phrase) => {
    const result = evaluate(phrase);
    expect(result.severity).toBe("warning");
    expect(result.handoffRequired).toBe(true);
    expect(result.flags).not.toContain("emergency_red_flag");
  });

  it("escalates a nonspecific finding in company", () => {
    expect(evaluate("Palpitations with dizziness and I fainted.").severity).toBe("critical");
    expect(evaluate("I have palpitations and chest tightness.").severity).toBe("critical");
  });

  it("keeps two isolated nonspecific findings at review level", () => {
    expect(evaluate("I have palpitations and some jaw pain.").severity).toBe("warning");
  });
});

describe("qualifier safety invariant", () => {
  it("never lets an uncertain denial clear a red flag", () => {
    const result = evaluate("I do not think it is chest pain, but I am not sure.");
    expect(result.severity).toBe("warning");
    expect(result.handoffRequired).toBe(true);
  });

  it("confines a negation to its own clause", () => {
    // The denial governs the chest symptom only; the breathing symptom stands.
    const result = evaluate("I have no chest pain but I am struggling to breathe.");
    expect(result.severity).toBe("critical");
  });

  it("records which qualifier acted on a concept", () => {
    expect(assessClinicalRedFlags("I have no chest pain.").qualified)
      .toContainEqual({ concept: "chest_discomfort", qualifier: "negated" });
    expect(assessClinicalRedFlags("History of angina.").qualified)
      .toContainEqual({ concept: "chest_discomfort", qualifier: "history" });
  });
});

describe("workflow consequence", () => {
  const complete = evaluateIntakeCompleteness({
    patientName: "Maya Chen",
    contact: "maya@example.com",
    reasonForVisit: "Cardiology consultation",
    requestedService: "cardiology",
    urgencyLevel: "medium",
    availability: "Weekday mornings",
    paymentType: "insurance",
  } as never);

  it("prevents scheduling progression for both red-flag tiers", () => {
    for (const message of [
      "I need to book today. My chest is tight and I am short of breath.",
      "I have been getting palpitations.",
    ]) {
      const policy = evaluate(message);
      const next = decideNextIntakeStatus({
        currentStatus: "collecting_information",
        policy,
        completeness: complete,
      });
      expect(next).toBe("needs_human_review");
    }
  });
});

describe("assistant output safety", () => {
  it("does not inherit patient-triage negation handling", () => {
    // For generated text the concern is the clinical assertion itself, so a
    // denial is not exculpatory.
    const result = validateAssistantOutputSafety("Based on your records you have no chest pain.");
    expect(result.decision).toBe("block");
    expect(result.flags).toContain("assistant_clinical_assertion");
  });

  it("still blocks medication guidance in generated text", () => {
    const result = validateAssistantOutputSafety("You should double your blood pressure medication.");
    expect(result.decision).toBe("block");
  });

  it("allows ordinary administrative replies", () => {
    const result = validateAssistantOutputSafety("I can collect your contact details and pass this to clinic staff.");
    expect(result.decision).toBe("allow");
  });
});
