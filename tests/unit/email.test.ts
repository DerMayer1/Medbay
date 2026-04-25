import { describe, expect, it } from "vitest";
import { renderLeadEmail } from "@/lib/email";

describe("notification fallback", () => {
  it("renders intake fields for mocked notifications", () => {
    const email = renderLeadEmail({
      name: "Alex Morgan",
      contact: "alex@example.com",
      reasonForVisit: "Skin concern",
      preferredService: "Dermatology",
      urgencyLevel: "medium",
      availability: "Tuesday afternoon",
      paymentType: "insurance",
      status: "qualified",
    });

    expect(email).toContain("Alex Morgan");
    expect(email).toContain("Dermatology");
    expect(email).toContain("Tuesday afternoon");
  });
});
