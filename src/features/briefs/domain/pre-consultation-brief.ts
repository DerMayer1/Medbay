import { z } from "zod";

export const BRIEF_SCHEMA_VERSION = "2.0.1" as const;

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, "Expected a lowercase SHA-256 hash.");
const nonEmptyText = z.string().trim().min(1).max(4_000);

export const sourcePageSchema = z.object({
  pageNumber: z.number().int().positive(),
  text: z.string().min(1).max(100_000),
  textSha256: sha256Schema,
}).strict();

export const briefSourceSchema = z.object({
  documentId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.literal("application/pdf"),
  byteSize: z.number().int().positive().max(6 * 1024 * 1024),
  documentSha256: sha256Schema,
  pages: z.array(sourcePageSchema).min(1).max(100),
}).strict();

export const factSectionSchema = z.enum([
  "reason_for_visit",
  "reported_symptoms",
  "medications",
  "allergies",
  "relevant_history",
  "prior_results",
  "missing_information",
]);

export const factCitationSchema = z.object({
  documentId: z.string().uuid(),
  pageNumber: z.number().int().positive(),
  quote: z.string().trim().min(1).max(1_000),
}).strict();

export const briefFactSchema = z.object({
  id: z.string().uuid(),
  section: factSectionSchema,
  label: z.string().trim().min(1).max(120),
  value: nonEmptyText,
  citations: z.array(factCitationSchema).min(1).max(5),
}).strict();

export const reviewStatusSchema = z.enum(["needs_review", "approved", "rejected"]);

export const preConsultationBriefSchema = z.object({
  schemaVersion: z.literal(BRIEF_SCHEMA_VERSION),
  versionId: z.string().uuid(),
  versionNumber: z.number().int().positive(),
  caseId: z.string().uuid(),
  specialty: z.literal("cardiology"),
  consultationType: z.literal("first_consultation"),
  status: reviewStatusSchema,
  // PostgreSQL renders timestamptz with a numeric offset ("+00:00"), which the
  // default zod datetime rule rejects. Both forms must parse or a brief read
  // back from the database can never be approved.
  generatedAt: z.string().datetime({ offset: true }),
  generatedBy: z.enum(["synthetic_stage_1", "ai_provider"]),
  contentSha256: sha256Schema,
  purpose: z.string().trim().min(1).max(500),
  facts: z.array(briefFactSchema).min(1).max(50),
  sources: z.array(briefSourceSchema).min(1).max(5),
  review: z.object({
    reviewerId: z.string().uuid(),
    reviewerName: z.string().trim().min(1).max(120),
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().trim().min(1).max(1_000),
    reviewedAt: z.string().datetime({ offset: true }),
  }).strict().optional(),
}).strict();

export type BriefReviewStatus = z.infer<typeof reviewStatusSchema>;
export type BriefSource = z.infer<typeof briefSourceSchema>;
export type BriefFact = z.infer<typeof briefFactSchema>;
export type PreConsultationBrief = z.infer<typeof preConsultationBriefSchema>;

export type BriefReadiness = {
  readyForReview: boolean;
  invalidFactIds: string[];
  reasons: string[];
};

function normalizeEvidence(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
}

export function evaluateBriefReadiness(value: unknown): BriefReadiness {
  const parsed = preConsultationBriefSchema.safeParse(value);
  if (!parsed.success) {
    return {
      readyForReview: false,
      invalidFactIds: [],
      reasons: parsed.error.issues.map((issue) => `${issue.path.join(".") || "brief"}: ${issue.message}`),
    };
  }

  const brief = parsed.data;
  const sourceById = new Map(brief.sources.map((source) => [source.documentId, source]));
  const invalidFactIds: string[] = [];
  const reasons: string[] = [];

  for (const fact of brief.facts) {
    const valid = fact.citations.every((citation) => {
      const page = sourceById
        .get(citation.documentId)
        ?.pages.find((candidate) => candidate.pageNumber === citation.pageNumber);
      return Boolean(page && normalizeEvidence(page.text).includes(normalizeEvidence(citation.quote)));
    });
    if (!valid) invalidFactIds.push(fact.id);
  }

  if (invalidFactIds.length) reasons.push("Every citation quote must occur on the referenced PDF page.");
  if (brief.status === "approved" && brief.review?.decision !== "approved") {
    reasons.push("An approved version requires an identified clinician approval.");
  }
  if (brief.status === "rejected" && brief.review?.decision !== "rejected") {
    reasons.push("A rejected version requires an identified clinician rejection.");
  }

  return { readyForReview: reasons.length === 0, invalidFactIds, reasons };
}

export function assertBriefCanBeApproved(value: unknown): PreConsultationBrief {
  const brief = preConsultationBriefSchema.parse(value);
  const readiness = evaluateBriefReadiness(brief);
  if (!readiness.readyForReview) throw new Error(readiness.reasons.join(" "));
  if (brief.status !== "needs_review") throw new Error("Only a version awaiting review can be approved.");
  return brief;
}

export function isPreConsultationBrief(value: unknown): value is PreConsultationBrief {
  return preConsultationBriefSchema.safeParse(value).success;
}
