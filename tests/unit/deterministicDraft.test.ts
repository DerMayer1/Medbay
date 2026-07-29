import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { draftBriefFromSources } from "@/features/briefs/domain/deterministic-draft";
import { evaluateBriefReadiness, type BriefSource } from "@/features/briefs/domain/pre-consultation-brief";

const hash = (seed: string) => createHash("sha256").update(seed).digest("hex");

function sourceOf(pageTexts: string[]): BriefSource {
  return {
    documentId: randomUUID(),
    fileName: "record.pdf",
    mimeType: "application/pdf",
    byteSize: 2048,
    documentSha256: hash(pageTexts.join("|")),
    pages: pageTexts.map((text, index) => ({ pageNumber: index + 1, text, textSha256: hash(text) })),
  };
}

function draft(sources: BriefSource[]) {
  return draftBriefFromSources({
    caseId: randomUUID(),
    versionId: randomUUID(),
    versionNumber: 1,
    sources,
    generatedAt: "2026-07-28T12:00:00.000Z",
  });
}

describe("deterministic Stage 1 draft", () => {
  it("quotes text that occurs on the page it cites", () => {
    const brief = draft([sourceOf([
      "Referral: recurring palpitations after exertion.",
      "Current medication: Bisoprolol 2.5 mg daily.",
    ])]);

    expect(evaluateBriefReadiness(brief).readyForReview).toBe(true);
    for (const fact of brief.facts) {
      for (const citation of fact.citations) {
        const page = brief.sources
          .find((source) => source.documentId === citation.documentId)
          ?.pages.find((candidate) => candidate.pageNumber === citation.pageNumber);
        expect(page?.text).toContain(citation.quote);
      }
    }
  });

  it("stops at the schema maximum instead of overflowing it", () => {
    // Eighty candidate statements across eight pages; the schema caps a version
    // at fifty facts, and exceeding that would fail the entire draft.
    const pages = Array.from({ length: 8 }, (_, page) =>
      Array.from({ length: 10 }, (_, index) => `Medication ${page}-${index}: Drug${page}${index} ${10 + index} mg daily.`).join(" "),
    );

    const brief = draft([sourceOf(pages)]);
    expect(brief.facts).toHaveLength(50);
    expect(evaluateBriefReadiness(brief).readyForReview).toBe(true);
  });

  it("is stable across regeneration of the same version", () => {
    const source = sourceOf(["Referral: syncope during exercise.", "History: hypertension since 2019."]);
    const input = { caseId: randomUUID(), versionId: randomUUID(), versionNumber: 1, sources: [source], generatedAt: "2026-07-28T12:00:00.000Z" };

    const first = draftBriefFromSources(input);
    const second = draftBriefFromSources(input);
    expect(second.facts.map((fact) => fact.id)).toEqual(first.facts.map((fact) => fact.id));
    expect(second.contentSha256).toBe(first.contentSha256);
  });

  it("does not repeat a statement that appears in several records", () => {
    const repeated = "Current medication: Bisoprolol 2.5 mg daily.";
    const brief = draft([sourceOf([repeated]), sourceOf([repeated])]);
    expect(brief.facts.filter((fact) => fact.value === repeated)).toHaveLength(1);
  });

  it("refuses to draft when nothing can be attributed to a page", () => {
    expect(() => draft([sourceOf(["Lorem ipsum dolor sit amet consectetur."])])).toThrow(/could be attributed/i);
  });
});
