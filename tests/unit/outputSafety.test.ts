import { describe, expect, it } from "vitest";
import { validateAssistantOutputSafety } from "@/features/intake/domain/policy-engine";

describe("assistant output safety validation", () => {
  it("blocks unsafe assistant output", () => {
    const result = validateAssistantOutputSafety("You should take antibiotics and I can diagnose this infection.");
    expect(result.decision).toBe("block");
    expect(result.handoffRequired).toBe(true);
  });
});
