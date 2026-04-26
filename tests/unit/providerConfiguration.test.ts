import { afterEach, describe, expect, it } from "vitest";
import { createCalendarEvent } from "@/lib/calendar";
import { notifyTeam } from "@/lib/email";
import { generateAssistantResponse } from "@/lib/openai";

describe("production provider configuration", () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...previousEnv };
  });

  it("requires OpenAI credentials for assistant responses", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      generateAssistantResponse({
        message: "Start intake",
        messages: [],
        knowledge: "",
        currentLeadState: "new",
      }),
    ).rejects.toThrow("OPENAI_API_KEY");
  });

  it("requires Resend configuration for notifications", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(notifyTeam("Subject", { status: "opened", source: "manual" })).rejects.toThrow("RESEND_API_KEY");
  });

  it("requires Google Calendar credentials for calendar events", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REFRESH_TOKEN;

    await expect(
      createCalendarEvent({
        summary: "Appointment",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      }),
    ).rejects.toThrow("Google Calendar OAuth credentials");
  });
});
