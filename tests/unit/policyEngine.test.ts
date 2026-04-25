import { describe, expect, it } from "vitest";
import { evaluateIntakePolicy } from "@/features/intake/domain/policy-engine";

describe("policy engine", () => {
  it("blocks diagnosis requests", () => {
    const result = evaluateIntakePolicy({ message: "Do I have cancer?" });
    expect(result.decision).toBe("block");
    expect(result.handoffRequired).toBe(true);
    expect(result.flags).toContain("diagnosis_request");
  });

  it("escalates emergency red flags", () => {
    const result = evaluateIntakePolicy({ message: "I have chest pain and shortness of breath" });
    expect(result.decision).toBe("escalate");
    expect(result.severity).toBe("critical");
    expect(result.flags).toContain("emergency_red_flag");
  });

  it("asks for contact before scheduling", () => {
    const result = evaluateIntakePolicy({
      message: "Can I book an appointment?",
      extractedFields: {},
      wantsScheduling: true,
    });
    expect(result.decision).toBe("ask_clarifying_question");
    expect(result.flags).toContain("missing_contact_before_scheduling");
  });
});
