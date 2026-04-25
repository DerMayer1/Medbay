import { describe, expect, it } from "vitest";
import { createCalendarEvent, getMockAvailableSlots } from "@/lib/calendar";

describe("mock calendar provider", () => {
  it("returns demo slots", async () => {
    const slots = await getMockAvailableSlots();
    expect(slots.length).toBeGreaterThan(0);
  });

  it("creates a mock event without credentials", async () => {
    const event = await createCalendarEvent({
      summary: "Northstar Clinic appointment",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    });
    expect(event.googleEventId).toContain("mock-");
  });
});
