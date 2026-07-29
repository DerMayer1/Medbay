import { beforeEach, describe, expect, it } from "vitest";
import { generateBriefVersion, ingestSourceDocument } from "@/features/briefs/application/stage-1-pipeline";
import { evaluateBriefReadiness } from "@/features/briefs/domain/pre-consultation-brief";
import { computeBriefContentSha256 } from "@/features/briefs/domain/brief-content-hash";
import { demoStage1Store, getDemoBriefVersion, getDemoLeadBundle, reviewDemoBriefVersion } from "@/lib/demoStore";
import { buildBornDigitalPdf } from "../fixtures/born-digital-pdf";

const caseId = "11111111-1111-4111-8111-111111111111";
const reviewer = { id: "30000000-0000-4000-8000-000000000001", name: "Dr. Synthetic Reviewer" };

const referralPdf = buildBornDigitalPdf([
  "Referral: recurring palpitations after exertion.",
  "Previous ECG referenced; report not attached.",
]);
const medicationPdf = buildBornDigitalPdf(["Current medication: Bisoprolol 2.5 mg daily."]);

async function attach(bytes: Uint8Array, fileName: string) {
  return ingestSourceDocument({ caseId, fileName, mimeType: "application/pdf", bytes, store: demoStage1Store });
}

beforeEach(() => {
  delete (globalThis as { __medbayDemoStore?: unknown }).__medbayDemoStore;
  getDemoLeadBundle(caseId);
  // Start from an empty document set so each test controls the sources.
  (globalThis as { __medbayDemoStore?: { briefSources?: Record<string, unknown[]> } }).__medbayDemoStore!.briefSources = { [caseId]: [] };
});

describe("Stage 1 vertical slice", () => {
  it("carries real PDF bytes through extraction, drafting and clinician approval", async () => {
    await attach(referralPdf, "referral.pdf");
    await attach(medicationPdf, "medications.pdf");

    const brief = await generateBriefVersion({ caseId, store: demoStage1Store });

    expect(brief.status).toBe("needs_review");
    expect(brief.sources).toHaveLength(2);
    expect(brief.facts.length).toBeGreaterThan(0);
    expect(evaluateBriefReadiness(brief).readyForReview).toBe(true);
    expect(brief.contentSha256).toBe(computeBriefContentSha256(brief));

    // Every generated fact must quote text that genuinely occurs on its page.
    for (const fact of brief.facts) {
      for (const citation of fact.citations) {
        const source = brief.sources.find((candidate) => candidate.documentId === citation.documentId);
        const page = source?.pages.find((candidate) => candidate.pageNumber === citation.pageNumber);
        expect(page?.text).toContain(citation.quote);
      }
    }

    const reviewed = reviewDemoBriefVersion({
      caseId,
      versionId: brief.versionId,
      expectedContentSha256: brief.contentSha256,
      decision: "approved",
      reason: "Checked each quote against the attached PDFs.",
      reviewer,
    });
    expect(reviewed.status).toBe("approved");
  });

  it("files statements under the sections the records actually state", async () => {
    await attach(referralPdf, "referral.pdf");
    await attach(medicationPdf, "medications.pdf");

    const brief = await generateBriefVersion({ caseId, store: demoStage1Store });
    const sections = new Set(brief.facts.map((fact) => fact.section));

    expect(sections.has("reason_for_visit")).toBe(true);
    expect(sections.has("medications")).toBe(true);
    expect(sections.has("missing_information")).toBe(true);
    // Nothing in these records supports an allergy statement.
    expect(sections.has("allergies")).toBe(false);
  });

  it("produces a new version instead of editing the previous one", async () => {
    await attach(referralPdf, "referral.pdf");
    const first = await generateBriefVersion({ caseId, store: demoStage1Store });

    await attach(medicationPdf, "medications.pdf");
    const second = await generateBriefVersion({ caseId, store: demoStage1Store });

    expect(second.versionNumber).toBe(first.versionNumber + 1);
    expect(second.versionId).not.toBe(first.versionId);
    expect(second.contentSha256).not.toBe(first.contentSha256);
    expect(getDemoBriefVersion(caseId)?.versionId).toBe(second.versionId);
  });

  it("refuses a duplicate document and enforces the five-document cap", async () => {
    await attach(referralPdf, "referral.pdf");
    await expect(attach(referralPdf, "referral-copy.pdf")).rejects.toThrow(/already been attached/i);

    for (let index = 0; index < 4; index += 1) {
      await attach(buildBornDigitalPdf([`Referral addendum ${index}: reported chest tightness.`]), `addendum-${index}.pdf`);
    }
    await expect(attach(buildBornDigitalPdf(["Referral addendum 5: reported dizziness."]), "addendum-5.pdf"))
      .rejects.toThrow(/at most 5 source documents/i);
  });

  it("rejects a scanned page and attaches nothing", async () => {
    const scanned = buildBornDigitalPdf(["Referral: palpitations.", ""]);
    await expect(attach(scanned, "scanned.pdf")).rejects.toThrow(/OCR.*outside Stage 1/i);
    await expect(demoStage1Store.listSources(caseId)).resolves.toHaveLength(0);
  });

  it("refuses to generate a version with no attached documents", async () => {
    await expect(generateBriefVersion({ caseId, store: demoStage1Store })).rejects.toThrow(/at least one source document/i);
  });
});
