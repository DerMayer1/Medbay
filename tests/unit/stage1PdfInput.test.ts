import { describe, expect, it } from "vitest";
import { validateAndExtractBornDigitalPdf } from "@/features/briefs/application/validate-stage-1-input";

const syntheticPdf = new TextEncoder().encode("%PDF-1.7 synthetic born-digital fixture");

describe("Stage 1 PDF input boundary", () => {
  it("hashes a PDF and its extracted pages", async () => {
    const source = await validateAndExtractBornDigitalPdf({
      documentId: "10000000-0000-4000-8000-000000000001",
      fileName: "synthetic.pdf",
      mimeType: "application/pdf",
      bytes: syntheticPdf,
      extract: async () => [{ pageNumber: 1, text: "  Referral   for palpitations. " }],
    });
    expect(source.documentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(source.pages[0].text).toBe("Referral for palpitations.");
    expect(source.pages[0].textSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects non-PDF and image-only pages", async () => {
    await expect(validateAndExtractBornDigitalPdf({
      documentId: "10000000-0000-4000-8000-000000000001",
      fileName: "fake.pdf", mimeType: "application/pdf", bytes: new TextEncoder().encode("not a pdf"), extract: async () => [],
    })).rejects.toThrow(/not a PDF/i);
    await expect(validateAndExtractBornDigitalPdf({
      documentId: "10000000-0000-4000-8000-000000000001",
      fileName: "scan.pdf", mimeType: "application/pdf", bytes: syntheticPdf, extract: async () => [{ pageNumber: 1, text: "" }],
    })).rejects.toThrow(/OCR.*outside Stage 1/i);
  });
});
