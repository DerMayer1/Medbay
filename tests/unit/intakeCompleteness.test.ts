import { describe, expect, it } from "vitest";
import { evaluateIntakeCompleteness } from "@/features/intake/domain/intake-completeness";

describe("intake completeness", () => {
  it("scores missing required fields", () => {
    const result = evaluateIntakeCompleteness({
      patientName: "Alex",
      contact: "alex@example.com",
      reasonForVisit: "Skin concern",
    });

    expect(result.readyForScheduling).toBe(false);
    expect(result.score).toBeLessThan(100);
    expect(result.missingFields).toContain("requestedService");
  });

  it("marks complete cases as ready for scheduling", () => {
    const result = evaluateIntakeCompleteness({
      patientName: "Alex",
      contact: "alex@example.com",
      reasonForVisit: "Skin concern",
      requestedService: "Dermatology",
      urgencyLevel: "medium",
      paymentType: "insurance",
      availability: "Tuesday afternoon",
    });

    expect(result.score).toBe(100);
    expect(result.readyForScheduling).toBe(true);
  });
});
