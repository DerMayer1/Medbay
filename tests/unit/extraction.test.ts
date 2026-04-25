import { describe, expect, it } from "vitest";
import { extractLeadByState, extractLeadHints } from "@/lib/extraction";

describe("intake extraction", () => {
  it("extracts contact, urgency and payment hints", () => {
    const extracted = extractLeadHints("My email is alex@example.com and this is urgent. I have insurance.");
    expect(extracted.email).toBe("alex@example.com");
    expect(extracted.urgencyLevel).toBe("urgent");
    expect(extracted.paymentType).toBe("insurance");
  });

  it("maps state-specific free text into intake fields", () => {
    expect(extractLeadByState("Tuesday afternoon", "collecting_availability").availability).toBe("Tuesday afternoon");
  });
});
