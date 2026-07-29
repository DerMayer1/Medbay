import { createHash } from "node:crypto";
import { briefSourceSchema, type BriefSource } from "@/features/briefs/domain/pre-consultation-brief";

export const STAGE_1_MAX_PDF_BYTES = 6 * 1024 * 1024;
export const STAGE_1_MAX_DOCUMENTS = 5;

export type ExtractedPdfPage = { pageNumber: number; text: string };
export type BornDigitalPdfExtractor = (bytes: Uint8Array) => Promise<ExtractedPdfPage[]>;

/**
 * Stage 1 caps a case at five source documents. The database enforces the same
 * budget on insert; this keeps the rejection at the upload boundary.
 */
export function assertStage1DocumentBudget(existingDocumentCount: number) {
  if (existingDocumentCount >= STAGE_1_MAX_DOCUMENTS) {
    throw new Error(`A Stage 1 case accepts at most ${STAGE_1_MAX_DOCUMENTS} source documents.`);
  }
}

export async function validateAndExtractBornDigitalPdf(input: {
  documentId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  extract: BornDigitalPdfExtractor;
  existingDocumentCount?: number;
}): Promise<BriefSource> {
  assertStage1DocumentBudget(input.existingDocumentCount ?? 0);
  if (input.mimeType !== "application/pdf") throw new Error("Stage 1 accepts PDF files only.");
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > STAGE_1_MAX_PDF_BYTES) throw new Error("PDF must be between 1 byte and 6 MB.");
  if (new TextDecoder("ascii").decode(input.bytes.slice(0, 5)) !== "%PDF-") throw new Error("The uploaded bytes are not a PDF.");

  const extracted = await input.extract(input.bytes);
  if (extracted.length === 0 || extracted.length > 100) throw new Error("PDF must contain between 1 and 100 extractable pages.");
  const pages = extracted.map((page, index) => {
    if (page.pageNumber !== index + 1) throw new Error("Extracted PDF pages must be consecutive and one-based.");
    const text = page.text.replace(/\s+/g, " ").trim();
    if (!text) throw new Error(`Page ${page.pageNumber} has no text. Scanned PDFs and OCR are outside Stage 1.`);
    return { pageNumber: page.pageNumber, text, textSha256: createHash("sha256").update(text).digest("hex") };
  });

  return briefSourceSchema.parse({
    documentId: input.documentId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    byteSize: input.bytes.byteLength,
    documentSha256: createHash("sha256").update(input.bytes).digest("hex"),
    pages,
  });
}
