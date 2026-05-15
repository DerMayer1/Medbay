import { describe, expect, it } from "vitest";
import {
  decideNextIntakeStatus,
  validateIntakeTransition,
} from "@/features/intake/domain/intake-workflow";

describe("intake workflow", () => {
  it("allows valid intake case transitions", () => {
    expect(validateIntakeTransition("opened", "collecting_information").valid).toBe(true);
    expect(validateIntakeTransition("collecting_information", "ready_for_scheduling").valid).toBe(true);
    expect(validateIntakeTransition("ready_for_scheduling", "appointment_requested").valid).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(validateIntakeTransition("closed", "scheduled").valid).toBe(false);
    expect(validateIntakeTransition("discarded", "collecting_information").valid).toBe(false);
  });

  it("routes critical or handoff cases to human review", () => {
    expect(
      decideNextIntakeStatus({
        currentStatus: "collecting_information",
        policy: {
          decision: "escalate",
          severity: "critical",
          reason: "Emergency red flag detected.",
          handoffRequired: true,
          safeResponseHint: "Escalate.",
          flags: ["emergency_red_flag"],
        },
        completeness: { score: 100, missingFields: [], readyForScheduling: true },
      }),
    ).toBe("needs_human_review");
  });
});
