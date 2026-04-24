import { describe, expect, it } from "vitest";
import { fallbackAssistantResponse } from "@/lib/openai";

describe("chat flow", () => {
  it("creates a scheduling reply without OpenAI credentials", () => {
    const output = fallbackAssistantResponse({
      message: "Quero agendar uma consulta",
      messages: [],
      knowledge: "",
      currentLeadState: "new",
    });

    expect(output.intent).toBe("schedule_appointment");
    expect(output.reply).toContain("nome completo");
  });
});
