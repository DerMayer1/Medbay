import { describe, expect, it } from "vitest";
import { renderLeadEmail } from "@/lib/email";

describe("email template", () => {
  it("renders qualified lead fields", () => {
    const email = renderLeadEmail({
      name: "Ana Silva",
      phone: "11999999999",
      consultationType: "first_consultation",
      goal: "Consulta inicial",
      modality: "online",
      schedulePreference: "terça de manhã",
      status: "ready_for_human_confirmation",
    });

    expect(email).toContain("Ana Silva");
    expect(email).toContain("terça de manhã");
  });
});
