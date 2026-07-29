import { randomUUID } from "node:crypto";
import { draftBriefFromSources } from "@/features/briefs/domain/deterministic-draft";
import { type BriefSource, type PreConsultationBrief } from "@/features/briefs/domain/pre-consultation-brief";
import { extractBornDigitalPdfPages } from "@/features/briefs/infrastructure/unpdf-extractor";
import {
  assertStage1DocumentBudget,
  validateAndExtractBornDigitalPdf,
  type BornDigitalPdfExtractor,
} from "@/features/briefs/application/validate-stage-1-input";

/**
 * Persistence the Stage 1 pipeline needs. Implemented by the Supabase adapter in
 * a deployment and by the in-memory store in demo mode, so both paths run the
 * same validation, drafting and provenance rules.
 */
export type Stage1BriefStore = {
  listSources(caseId: string): Promise<BriefSource[]>;
  saveSource(caseId: string, source: BriefSource, bytes: Uint8Array): Promise<void>;
  nextVersionNumber(caseId: string): Promise<number>;
  saveBriefVersion(caseId: string, brief: PreConsultationBrief): Promise<PreConsultationBrief>;
};

export type IngestSourceDocumentInput = {
  caseId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  store: Stage1BriefStore;
  extract?: BornDigitalPdfExtractor;
};

/**
 * Validates an uploaded PDF, extracts its pages, and stores the document with
 * its page text. The document is rejected before anything is written when it
 * fails the Stage 1 boundary.
 */
export async function ingestSourceDocument(input: IngestSourceDocumentInput): Promise<BriefSource> {
  const existing = await input.store.listSources(input.caseId);
  assertStage1DocumentBudget(existing.length);

  const source = await validateAndExtractBornDigitalPdf({
    documentId: randomUUID(),
    fileName: input.fileName,
    mimeType: input.mimeType,
    bytes: input.bytes,
    extract: input.extract ?? extractBornDigitalPdfPages,
    existingDocumentCount: existing.length,
  });

  if (existing.some((candidate) => candidate.documentSha256 === source.documentSha256)) {
    throw new Error("This document has already been attached to the case.");
  }

  await input.store.saveSource(input.caseId, source, input.bytes);
  return source;
}

/**
 * Generates a new immutable brief version from everything currently attached to
 * the case. Corrections produce a new version; an existing version is never
 * edited in place.
 */
export async function generateBriefVersion(input: { caseId: string; store: Stage1BriefStore; now?: () => Date }): Promise<PreConsultationBrief> {
  const sources = await input.store.listSources(input.caseId);
  if (!sources.length) throw new Error("Attach at least one source document before generating a brief.");

  const brief = draftBriefFromSources({
    caseId: input.caseId,
    versionId: randomUUID(),
    versionNumber: await input.store.nextVersionNumber(input.caseId),
    sources,
    generatedAt: (input.now?.() ?? new Date()).toISOString(),
  });

  return input.store.saveBriefVersion(input.caseId, brief);
}
