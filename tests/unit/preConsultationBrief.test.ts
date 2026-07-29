import { describe, expect, it } from "vitest";
import {
  assertBriefCanBeApproved,
  evaluateBriefReadiness,
  preConsultationBriefSchema,
  type PreConsultationBrief,
} from "@/features/briefs/domain/pre-consultation-brief";

const hash = (character: string) => character.repeat(64);

function syntheticBrief(index = 1): PreConsultationBrief {
  const suffix = String(index).padStart(12, "0");
  const caseId = `00000000-0000-4000-8000-${suffix}`;
  const documentId = `10000000-0000-4000-8000-${suffix}`;
  return {
    schemaVersion: "2.0.1",
    versionId: `20000000-0000-4000-8000-${suffix}`,
    versionNumber: 1,
    caseId,
    specialty: "cardiology",
    consultationType: "first_consultation",
    status: "needs_review",
    generatedAt: "2026-07-28T12:00:00.000Z",
    generatedBy: "synthetic_stage_1",
    contentSha256: hash("a"),
    purpose: "Prepare factual source context without diagnosis, risk scoring, or treatment recommendations.",
    facts: [{
      id: `30000000-0000-4000-8000-${suffix}`,
      section: "reason_for_visit",
      label: "Reason for visit",
      value: `Synthetic cardiology referral ${index}`,
      citations: [{ documentId, pageNumber: 1, quote: `Referral ${index}: recurring palpitations.` }],
    }],
    sources: [{
      documentId,
      fileName: `synthetic-referral-${index}.pdf`,
      mimeType: "application/pdf",
      byteSize: 1200 + index,
      documentSha256: hash("b"),
      pages: [{ pageNumber: 1, text: `Referral ${index}: recurring palpitations. No interpretation included.`, textSha256: hash("c") }],
    }],
  };
}

describe("Medbay 2.0.1 pre-consultation brief", () => {
  it("validates the 12-case synthetic Stage 1 cohort", () => {
    const cohort = Array.from({ length: 12 }, (_, index) => syntheticBrief(index + 1));
    expect(cohort).toHaveLength(12);
    for (const candidate of cohort) {
      expect(preConsultationBriefSchema.safeParse(candidate).success).toBe(true);
      expect(evaluateBriefReadiness(candidate).readyForReview).toBe(true);
      expect(assertBriefCanBeApproved(candidate).versionId).toBe(candidate.versionId);
    }
  });

  it("rejects a quote that is absent from the referenced page", () => {
    const candidate = syntheticBrief();
    candidate.facts[0].citations[0].quote = "Fabricated evidence";
    const result = evaluateBriefReadiness(candidate);
    expect(result.readyForReview).toBe(false);
    expect(result.invalidFactIds).toEqual([candidate.facts[0].id]);
    expect(() => assertBriefCanBeApproved(candidate)).toThrow(/citation quote/i);
  });

  it("rejects unknown fields and unsupported clinical scope", () => {
    const candidate = { ...syntheticBrief(), diagnosis: "Not permitted" };
    expect(preConsultationBriefSchema.safeParse(candidate).success).toBe(false);
    expect(preConsultationBriefSchema.safeParse({ ...syntheticBrief(), specialty: "neurology" }).success).toBe(false);
  });

  it("requires final decisions to identify the clinician and reason", () => {
    expect(evaluateBriefReadiness({ ...syntheticBrief(), status: "approved" }).readyForReview).toBe(false);
  });
});
