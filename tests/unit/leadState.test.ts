import { describe, expect, it } from "vitest";
import { getNextLeadState, hasQualifiedLeadData } from "@/lib/leadState";

describe("lead state machine", () => {
  it("collects scheduling fields in order", () => {
    expect(getNextLeadState("new", {}, "schedule_appointment")).toBe("collecting_name");
    expect(getNextLeadState("collecting_name", { name: "Ana Silva" }, "schedule_appointment")).toBe(
      "collecting_consultation_type",
    );
    expect(
      getNextLeadState(
        "collecting_modality",
        { name: "Ana", consultationType: "first_consultation", goal: "Organizar rotina", modality: "online" },
        "schedule_appointment",
      ),
    ).toBe("collecting_schedule_preference");
  });

  it("detects qualified lead", () => {
    expect(
      hasQualifiedLeadData({
        name: "Ana",
        consultationType: "first_consultation",
        goal: "Rotina",
        modality: "online",
        schedulePreference: "manhã",
        phone: "11999999999",
      }),
    ).toBe(true);
  });
});
