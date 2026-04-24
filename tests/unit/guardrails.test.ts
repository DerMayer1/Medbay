import { describe, expect, it } from "vitest";
import { applyDeterministicGuardrails, classifyIntent, requiresClinicalHandoff } from "@/lib/guardrails";
import { fallbackAssistantResponse } from "@/lib/openai";

describe("guardrails", () => {
  it("classifies clinical requests as clinical_question", () => {
    expect(classifyIntent("Pode montar uma dieta para emagrecer?")).toBe("clinical_question");
    expect(requiresClinicalHandoff("Qual suplemento devo tomar?")).toBe(true);
  });

  it("overrides unsafe assistant output", () => {
    const output = fallbackAssistantResponse({
      message: "Interprete meus exames",
      messages: [],
      knowledge: "",
      currentLeadState: "chatting",
    });

    const guarded = applyDeterministicGuardrails("Interprete meus exames", output);
    expect(guarded.handoffRequired).toBe(true);
    expect(guarded.leadState).toBe("human_handoff");
    expect(guarded.reply).toContain("consulta");
  });
});
