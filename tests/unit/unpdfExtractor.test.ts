import { describe, expect, it } from "vitest";
import { extractBornDigitalPdfPages } from "@/features/briefs/infrastructure/unpdf-extractor";
import { validateAndExtractBornDigitalPdf } from "@/features/briefs/application/validate-stage-1-input";
import { buildBornDigitalPdf } from "../fixtures/born-digital-pdf";

const documentId = "10000000-0000-4000-8000-000000000001";

describe("born-digital PDF extraction", () => {
  it("extracts consecutive page text from real PDF bytes", async () => {
    const bytes = buildBornDigitalPdf([
      "Referral: recurring palpitations after exertion.",
      "Current medication: Propranolol 10 mg as needed.",
    ]);

    const pages = await extractBornDigitalPdfPages(bytes);
    expect(pages.map((page) => page.pageNumber)).toEqual([1, 2]);
    expect(pages[0].text).toContain("recurring palpitations");
    expect(pages[1].text).toContain("Propranolol 10 mg");
  });

  it("produces a source whose citations can be verified against the extracted pages", async () => {
    const bytes = buildBornDigitalPdf(["Referral: recurring palpitations after exertion."]);

    const source = await validateAndExtractBornDigitalPdf({
      documentId,
      fileName: "referral.pdf",
      mimeType: "application/pdf",
      bytes,
      extract: extractBornDigitalPdfPages,
    });

    expect(source.byteSize).toBe(bytes.byteLength);
    expect(source.documentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(source.pages).toHaveLength(1);
    expect(source.pages[0].text).toContain("recurring palpitations");
  });

  it("leaves the caller's bytes intact for hashing", async () => {
    const bytes = buildBornDigitalPdf(["Referral: chest tightness on exertion."]);
    const before = bytes.slice();

    await extractBornDigitalPdfPages(bytes);

    expect(bytes.byteLength).toBe(before.byteLength);
    expect(Array.from(bytes.slice(0, 8))).toEqual(Array.from(before.slice(0, 8)));
  });

  it("rejects a page with no text layer as an unsupported scanned document", async () => {
    const bytes = buildBornDigitalPdf(["Referral: palpitations.", ""]);

    await expect(validateAndExtractBornDigitalPdf({
      documentId,
      fileName: "half-scanned.pdf",
      mimeType: "application/pdf",
      bytes,
      extract: extractBornDigitalPdfPages,
    })).rejects.toThrow(/OCR.*outside Stage 1/i);
  });
});
