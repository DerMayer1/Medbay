import { describe, expect, it } from "vitest";
import {
  assertBriefCanBeApproved,
  evaluateBriefReadiness,
  preConsultationBriefSchema,
  type BriefFact,
  type PreConsultationBrief,
} from "@/features/briefs/domain/pre-consultation-brief";

const hash = (character: string) => character.repeat(64);
const uuid = (prefix: string, index: number) => `${prefix}-0000-4000-8000-${String(index).padStart(12, "0")}`;

/**
 * Twelve synthetic cardiology first consultations. Each case varies the fact
 * sections, fact count, document count and page count so the cohort exercises
 * the schema rather than repeating one shape twelve times.
 */
const cohortSpecs: Array<{ sections: BriefFact["section"][]; documents: string[][] }> = [
  { sections: ["reason_for_visit"], documents: [["Referral: recurring palpitations after exertion."]] },
  { sections: ["reason_for_visit", "medications"], documents: [["Referral: chest tightness on climbing stairs."], ["Current medication: Bisoprolol 2.5 mg daily."]] },
  { sections: ["reason_for_visit", "allergies"], documents: [["Referral: episodic dizziness.", "Allergy list: penicillin causes rash."]] },
  { sections: ["reported_symptoms", "relevant_history"], documents: [["Symptoms: shortness of breath at night.", "History: hypertension noted since 2019."]] },
  { sections: ["reason_for_visit", "prior_results"], documents: [["Referral: irregular pulse."], ["Prior ECG performed 2026-02-11; report attached separately."]] },
  { sections: ["missing_information"], documents: [["Intake form returned without a medication list."]] },
  { sections: ["reason_for_visit", "reported_symptoms", "medications"], documents: [["Referral: palpitations with lightheadedness.", "Symptoms: episodes last under two minutes.", "Medication: Propranolol 10 mg as needed."]] },
  { sections: ["relevant_history"], documents: [["History: father had a myocardial infarction at 54."]] },
  { sections: ["medications", "allergies"], documents: [["Medication: Atorvastatin 20 mg nightly."], ["Allergy list: no known drug allergies recorded."]] },
  { sections: ["prior_results", "missing_information"], documents: [["Prior echocardiogram referenced in the referral letter."], ["Echocardiogram report itself was not supplied by the referring clinic."]] },
  { sections: ["reason_for_visit", "reported_symptoms", "relevant_history", "medications"], documents: [["Referral: pre-operative cardiac assessment requested.", "Symptoms: no chest pain reported.", "History: type 2 diabetes since 2021."], ["Medication: Metformin 500 mg twice daily."]] },
  { sections: ["reason_for_visit", "prior_results", "missing_information"], documents: [["Referral: syncope during exercise.", "Prior Holter monitor referenced."], ["Holter monitor summary is pending from the referring clinic."]] },
];

function syntheticBrief(index = 1): PreConsultationBrief {
  const spec = cohortSpecs[(index - 1) % cohortSpecs.length];
  const sources = spec.documents.map((pageTexts, documentIndex) => ({
    documentId: uuid("10000000", index * 100 + documentIndex),
    fileName: `synthetic-case-${index}-doc-${documentIndex + 1}.pdf`,
    mimeType: "application/pdf" as const,
    byteSize: 1200 + index + documentIndex,
    documentSha256: hash("b"),
    pages: pageTexts.map((text, pageIndex) => ({ pageNumber: pageIndex + 1, text, textSha256: hash("c") })),
  }));

  // Each fact quotes the page that carries its evidence, walking the flattened
  // page list so multi-document and multi-page cases are both represented.
  const flattenedPages = sources.flatMap((source) => source.pages.map((page) => ({ documentId: source.documentId, page })));
  const facts = spec.sections.map((section, factIndex) => {
    const target = flattenedPages[Math.min(factIndex, flattenedPages.length - 1)];
    return {
      id: uuid("30000000", index * 100 + factIndex),
      section,
      label: section.replace(/_/g, " "),
      value: `Synthetic ${section.replace(/_/g, " ")} for case ${index}.`,
      citations: [{ documentId: target.documentId, pageNumber: target.page.pageNumber, quote: target.page.text }],
    };
  });

  return {
    schemaVersion: "2.0.1",
    versionId: uuid("20000000", index),
    versionNumber: 1,
    caseId: uuid("00000000", index),
    specialty: "cardiology",
    consultationType: "first_consultation",
    status: "needs_review",
    generatedAt: "2026-07-28T12:00:00.000Z",
    generatedBy: "synthetic_stage_1",
    contentSha256: hash("a"),
    purpose: "Prepare factual source context without diagnosis, risk scoring, or treatment recommendations.",
    facts,
    sources,
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

  it("covers every approved fact section and multi-document cases across the cohort", () => {
    const cohort = Array.from({ length: 12 }, (_, index) => syntheticBrief(index + 1));
    const sections = new Set(cohort.flatMap((brief) => brief.facts.map((fact) => fact.section)));
    expect(sections).toEqual(new Set([
      "reason_for_visit",
      "reported_symptoms",
      "medications",
      "allergies",
      "relevant_history",
      "prior_results",
      "missing_information",
    ]));
    expect(cohort.some((brief) => brief.sources.length > 1)).toBe(true);
    expect(cohort.some((brief) => brief.sources.some((source) => source.pages.length > 1))).toBe(true);
  });

  it("rejects a quote that is absent from the referenced page", () => {
    const candidate = syntheticBrief();
    candidate.facts[0].citations[0].quote = "Fabricated evidence";
    const result = evaluateBriefReadiness(candidate);
    expect(result.readyForReview).toBe(false);
    expect(result.invalidFactIds).toEqual([candidate.facts[0].id]);
    expect(() => assertBriefCanBeApproved(candidate)).toThrow(/citation quote/i);
  });

  it("rejects a real quote attached to the wrong page", () => {
    const candidate = syntheticBrief(3);
    expect(candidate.sources[0].pages.length).toBeGreaterThan(1);
    candidate.facts[0].citations[0].pageNumber = 2;
    expect(evaluateBriefReadiness(candidate).invalidFactIds).toEqual([candidate.facts[0].id]);
  });

  it("rejects a citation pointing at a document the brief does not carry", () => {
    const candidate = syntheticBrief();
    candidate.facts[0].citations[0].documentId = uuid("99999999", 1);
    expect(evaluateBriefReadiness(candidate).readyForReview).toBe(false);
  });

  it("rejects a fact with no citation at all", () => {
    const candidate = { ...syntheticBrief(), facts: [{ ...syntheticBrief().facts[0], citations: [] }] };
    expect(preConsultationBriefSchema.safeParse(candidate).success).toBe(false);
  });

  it("rejects more than five source documents", () => {
    const candidate = syntheticBrief();
    const source = candidate.sources[0];
    candidate.sources = Array.from({ length: 6 }, (_, index) => ({ ...source, documentId: uuid("40000000", index) }));
    expect(preConsultationBriefSchema.safeParse(candidate).success).toBe(false);
  });

  it("accepts the timestamp formats PostgreSQL and JavaScript produce", () => {
    // PostgreSQL renders timestamptz with a numeric offset; rejecting it would
    // make any brief read back from the database unapprovable.
    for (const generatedAt of ["2026-07-28T12:00:00.000Z", "2026-07-28T12:00:00+00:00", "2026-07-28T12:00:00.123456+00:00"]) {
      expect(preConsultationBriefSchema.safeParse({ ...syntheticBrief(), generatedAt }).success).toBe(true);
    }
    expect(preConsultationBriefSchema.safeParse({ ...syntheticBrief(), generatedAt: "not a timestamp" }).success).toBe(false);
  });

  it("rejects unknown fields and unsupported clinical scope", () => {
    const candidate = { ...syntheticBrief(), diagnosis: "Not permitted" };
    expect(preConsultationBriefSchema.safeParse(candidate).success).toBe(false);
    expect(preConsultationBriefSchema.safeParse({ ...syntheticBrief(), specialty: "neurology" }).success).toBe(false);
    expect(preConsultationBriefSchema.safeParse({ ...syntheticBrief(), consultationType: "follow_up" }).success).toBe(false);
    expect(preConsultationBriefSchema.safeParse({ ...syntheticBrief(), facts: [{ ...syntheticBrief().facts[0], section: "treatment_plan" }] }).success).toBe(false);
  });

  it("requires final decisions to identify the clinician and reason", () => {
    expect(evaluateBriefReadiness({ ...syntheticBrief(), status: "approved" }).readyForReview).toBe(false);
    expect(evaluateBriefReadiness({ ...syntheticBrief(), status: "rejected" }).readyForReview).toBe(false);
  });

  it("refuses to approve a version that already carries a final decision", () => {
    const approved = {
      ...syntheticBrief(),
      status: "approved" as const,
      review: {
        reviewerId: uuid("50000000", 1),
        reviewerName: "Dr. Reyes",
        decision: "approved" as const,
        reason: "Verified against source pages.",
        reviewedAt: "2026-07-28T13:00:00.000Z",
      },
    };
    expect(() => assertBriefCanBeApproved(approved)).toThrow(/awaiting review/i);
  });
});
