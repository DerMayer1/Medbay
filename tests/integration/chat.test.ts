import { describe, expect, it } from "vitest";
import { fallbackAssistantResponse } from "@/lib/openai";

describe("demo chat flow", () => {
  it("creates an intake reply without OpenAI credentials", () => {
    const output = fallbackAssistantResponse({
      message: "Start a new patient intake",
      messages: [],
      knowledge: "",
      currentLeadState: "new",
    });

    expect(output.intent).toBe("patient_intake");
    expect(output.reply).toContain("full name");
  });
});
