import { extractText, getDocumentProxy } from "unpdf";
import type { BornDigitalPdfExtractor } from "@/features/briefs/application/validate-stage-1-input";

/**
 * Born-digital text extraction for Stage 1.
 *
 * Pages are returned in document order with one-based numbers so the caller can
 * reject any gap. Text layers are read as-is: a page that carries no text layer
 * comes back empty and is rejected upstream as an unsupported scanned document,
 * because Stage 1 excludes OCR.
 */
export const extractBornDigitalPdfPages: BornDigitalPdfExtractor = async (bytes) => {
  // pdf.js takes ownership of the buffer it is handed, so it receives a copy and
  // the caller keeps intact bytes to hash.
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: false });
  return text.map((pageText, index) => ({
    pageNumber: index + 1,
    text: typeof pageText === "string" ? pageText : "",
  }));
};
