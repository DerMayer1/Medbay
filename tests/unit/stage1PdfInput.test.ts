import { describe, expect, it } from "vitest";
import {
  assertStage1DocumentBudget,
  STAGE_1_MAX_DOCUMENTS,
  validateAndExtractBornDigitalPdf,
} from "@/features/briefs/application/validate-stage-1-input";

const syntheticPdf = new TextEncoder().encode("%PDF-1.7 synthetic born-digital fixture");
const documentId = "10000000-0000-4000-8000-000000000001";

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

  it("rejects non-consecutive extracted pages", async () => {
    await expect(validateAndExtractBornDigitalPdf({
      documentId,
      fileName: "gap.pdf", mimeType: "application/pdf", bytes: syntheticPdf,
      extract: async () => [{ pageNumber: 1, text: "First page." }, { pageNumber: 3, text: "Third page." }],
    })).rejects.toThrow(/consecutive/i);
  });

  it("rejects a document beyond the 100 page ceiling", async () => {
    await expect(validateAndExtractBornDigitalPdf({
      documentId,
      fileName: "long.pdf", mimeType: "application/pdf", bytes: syntheticPdf,
      extract: async () => Array.from({ length: 101 }, (_, index) => ({ pageNumber: index + 1, text: `Page ${index + 1}.` })),
    })).rejects.toThrow(/between 1 and 100/i);
  });

  it("rejects an empty document and one past the 6 MB ceiling", async () => {
    const extract = async () => [{ pageNumber: 1, text: "Referral." }];
    await expect(validateAndExtractBornDigitalPdf({
      documentId, fileName: "empty.pdf", mimeType: "application/pdf", bytes: new Uint8Array(0), extract,
    })).rejects.toThrow(/between 1 byte and 6 MB/i);

    const oversized = new Uint8Array(6 * 1024 * 1024 + 1);
    oversized.set(new TextEncoder().encode("%PDF-"));
    await expect(validateAndExtractBornDigitalPdf({
      documentId, fileName: "big.pdf", mimeType: "application/pdf", bytes: oversized, extract,
    })).rejects.toThrow(/between 1 byte and 6 MB/i);
  });

  it("caps a Stage 1 case at five source documents", async () => {
    expect(() => assertStage1DocumentBudget(STAGE_1_MAX_DOCUMENTS - 1)).not.toThrow();
    expect(() => assertStage1DocumentBudget(STAGE_1_MAX_DOCUMENTS)).toThrow(/at most 5 source documents/i);

    await expect(validateAndExtractBornDigitalPdf({
      documentId,
      fileName: "sixth.pdf", mimeType: "application/pdf", bytes: syntheticPdf,
      extract: async () => [{ pageNumber: 1, text: "Sixth document." }],
      existingDocumentCount: STAGE_1_MAX_DOCUMENTS,
    })).rejects.toThrow(/at most 5 source documents/i);
  });
});
