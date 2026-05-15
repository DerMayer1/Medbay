import { describe, expect, it } from "vitest";
import { getNextLeadState, hasQualifiedLeadData } from "@/lib/leadState";

describe("lead status transitions", () => {
  it("collects intake fields in order", () => {
    expect(getNextLeadState("new", {}, "patient_intake")).toBe("collecting_name");
    expect(getNextLeadState("collecting_name", { name: "Alex Morgan" }, "patient_intake")).toBe(
      "collecting_contact",
    );
    expect(
      getNextLeadState(
        "collecting_service",
        {
          name: "Alex",
          contact: "alex@example.com",
          reasonForVisit: "Skin concern",
          preferredService: "Dermatology",
        },
        "patient_intake",
      ),
    ).toBe("collecting_urgency");
  });

  it("detects qualified intake data", () => {
    expect(
      hasQualifiedLeadData({
        name: "Alex",
        contact: "alex@example.com",
        reasonForVisit: "Annual checkup",
        preferredService: "Primary care",
        urgencyLevel: "low",
        availability: "Monday morning",
        paymentType: "insurance",
      }),
    ).toBe(true);
  });
});
