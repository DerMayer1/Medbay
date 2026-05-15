import { describe, expect, it } from "vitest";
import { applyDeterministicGuardrails, classifyIntent, requiresClinicalHandoff } from "@/lib/guardrails";
import { fallbackAssistantResponse } from "@/lib/openai";

describe("guardrails", () => {
  it("classifies unsafe medical requests as clinical handoff", () => {
    expect(classifyIntent("Can you interpret my lab results?")).toBe("clinical_question");
    expect(requiresClinicalHandoff("What supplement should I take?")).toBe(true);
  });

  it("overrides unsafe output with a safe handoff message", () => {
    const output = fallbackAssistantResponse({
      message: "Can you diagnose this rash?",
      messages: [],
      knowledge: "",
      currentLeadState: "new",
    });

    const guarded = applyDeterministicGuardrails("Can you diagnose this rash?", output);
    expect(guarded.handoffRequired).toBe(true);
    expect(guarded.leadState).toBe("waiting_human");
    expect(guarded.reply).toContain("diagnosis");
  });
});
