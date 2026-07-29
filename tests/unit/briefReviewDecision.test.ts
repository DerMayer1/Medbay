import { beforeEach, describe, expect, it } from "vitest";
import { getDemoLeadBundle, reviewDemoBriefVersion } from "@/lib/demoStore";
import { computeBriefContentSha256 } from "@/features/briefs/domain/brief-content-hash";
import { type PreConsultationBrief } from "@/features/briefs/domain/pre-consultation-brief";

const caseId = "11111111-1111-4111-8111-111111111111";
const reviewer = { id: "30000000-0000-4000-8000-000000000001", name: "Dr. Synthetic Reviewer" };

type DemoStoreHandle = {
  __medbayDemoStore?: { leads: Array<{ id: string; pre_consultation_brief?: unknown }> };
};

const globalForDemo = globalThis as typeof globalThis & DemoStoreHandle;

function currentBrief(): PreConsultationBrief {
  return getDemoLeadBundle(caseId).lead.pre_consultation_brief as PreConsultationBrief;
}

function replaceStoredBrief(mutate: (brief: PreConsultationBrief) => void) {
  const store = globalForDemo.__medbayDemoStore;
  if (!store) throw new Error("Demo store was not initialized.");
  const lead = store.leads.find((candidate) => candidate.id === caseId);
  if (!lead) throw new Error("Synthetic case was not found.");
  const brief = lead.pre_consultation_brief as PreConsultationBrief;
  mutate(brief);
  brief.contentSha256 = computeBriefContentSha256(brief);
}

beforeEach(() => {
  delete globalForDemo.__medbayDemoStore;
  getDemoLeadBundle(caseId);
});

describe("Stage 1 brief review decision", () => {
  it("derives the content hash from the reviewed content", () => {
    const brief = currentBrief();
    expect(brief.contentSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(brief.contentSha256).toBe(computeBriefContentSha256(brief));

    replaceStoredBrief((stored) => {
      stored.facts[0].value = "Edited after generation.";
    });
    expect(currentBrief().contentSha256).not.toBe(brief.contentSha256);
  });

  it("records the clinician, reason and audit event on approval", () => {
    const brief = currentBrief();
    const reviewed = reviewDemoBriefVersion({
      caseId,
      versionId: brief.versionId,
      expectedContentSha256: brief.contentSha256,
      decision: "approved",
      reason: "Verified every citation against its source page.",
      reviewer,
    });

    expect(reviewed.status).toBe("approved");
    expect(reviewed.review).toMatchObject({ reviewerId: reviewer.id, decision: "approved" });

    const bundle = getDemoLeadBundle(caseId);
    expect(bundle.lead.brief_review_status).toBe("approved");
    expect(bundle.auditEvents.some((event) => event.action === "brief_approved")).toBe(true);
  });

  it("rejects a stale expected content hash without changing the version", () => {
    const brief = currentBrief();
    expect(() => reviewDemoBriefVersion({
      caseId,
      versionId: brief.versionId,
      expectedContentSha256: "b".repeat(64),
      decision: "approved",
      reason: "Reviewed a screen that is no longer current.",
      reviewer,
    })).toThrow(/changed/i);

    expect(currentBrief().status).toBe("needs_review");
  });

  it("rejects a second final decision on the same version", () => {
    const brief = currentBrief();
    const decision = {
      caseId,
      versionId: brief.versionId,
      expectedContentSha256: brief.contentSha256,
      decision: "approved" as const,
      reason: "Verified every citation against its source page.",
      reviewer,
    };
    reviewDemoBriefVersion(decision);

    expect(() => reviewDemoBriefVersion(decision)).toThrow(/already/i);
    expect(() => reviewDemoBriefVersion({ ...decision, decision: "rejected", reason: "Changed my mind." })).toThrow(/already/i);
    expect(currentBrief().review?.decision).toBe("approved");
  });

  it("blocks approval when a citation quote is absent from the cited page", () => {
    replaceStoredBrief((stored) => {
      stored.facts[0].citations[0].quote = "Fabricated evidence that appears on no page.";
    });
    const brief = currentBrief();

    expect(() => reviewDemoBriefVersion({
      caseId,
      versionId: brief.versionId,
      expectedContentSha256: brief.contentSha256,
      decision: "approved",
      reason: "Attempted approval of an unsupported fact.",
      reviewer,
    })).toThrow(/citation quote/i);

    expect(currentBrief().status).toBe("needs_review");
  });

  it("blocks approval when a citation points at the wrong page", () => {
    replaceStoredBrief((stored) => {
      stored.sources[0].pages.push({ pageNumber: 2, text: "Unrelated administrative page.", textSha256: "c".repeat(64) });
      stored.facts[0].citations[0].pageNumber = 2;
    });
    const brief = currentBrief();

    expect(() => reviewDemoBriefVersion({
      caseId,
      versionId: brief.versionId,
      expectedContentSha256: brief.contentSha256,
      decision: "approved",
      reason: "Attempted approval of a misattributed quote.",
      reviewer,
    })).toThrow(/citation quote/i);
  });

  it("allows rejection of a version that could never be approved", () => {
    replaceStoredBrief((stored) => {
      stored.facts[0].citations[0].quote = "Fabricated evidence that appears on no page.";
    });
    const brief = currentBrief();

    const reviewed = reviewDemoBriefVersion({
      caseId,
      versionId: brief.versionId,
      expectedContentSha256: brief.contentSha256,
      decision: "rejected",
      reason: "Citation does not support the stated fact.",
      reviewer,
    });

    expect(reviewed.status).toBe("rejected");
  });
});
