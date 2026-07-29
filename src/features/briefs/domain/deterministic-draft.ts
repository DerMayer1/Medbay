import { createHash } from "node:crypto";
import { computeBriefContentSha256 } from "@/features/briefs/domain/brief-content-hash";
import {
  BRIEF_SCHEMA_VERSION,
  preConsultationBriefSchema,
  type BriefFact,
  type BriefSource,
  type PreConsultationBrief,
} from "@/features/briefs/domain/pre-consultation-brief";

/** Matches the maximum the brief schema accepts for a single version. */
const MAX_FACTS = 50;

const BRIEF_PURPOSE =
  "Organize the supplied records into source-linked context for a cardiology first consultation. " +
  "This brief does not diagnose, interpret results, score risk, or recommend treatment.";

/**
 * Section routing for the Stage 1 draft. Each rule matches a sentence in an
 * extracted page and files it under an approved factual section. The rules are
 * intentionally literal: they recognize how a record states something, never
 * what it means clinically.
 */
const sectionRules: Array<{ section: BriefFact["section"]; label: string; pattern: RegExp }> = [
  { section: "medications", label: "Medication recorded in the source", pattern: /\b(medication|prescribed|\d+\s?mg\b|daily|nightly|as needed)\b/i },
  { section: "allergies", label: "Allergy recorded in the source", pattern: /\ballerg(y|ies|ic)\b|\bno known drug allergies\b/i },
  { section: "missing_information", label: "Information the records do not contain", pattern: /\b(not attached|not supplied|not provided|not included|pending|unavailable|awaiting|missing)\b/i },
  { section: "prior_results", label: "Prior result referenced in the source", pattern: /\b(ecg|ekg|echocardiogram|holter|monitor|lab|report|imaging|x-ray)\b/i },
  { section: "relevant_history", label: "History recorded in the source", pattern: /\b(history|since \d{4}|diagnosed|family history|father|mother)\b/i },
  { section: "reported_symptoms", label: "Symptom reported in the source", pattern: /\b(symptom|palpitation|chest (pain|tightness)|shortness of breath|dizziness|syncope|lightheaded|fatigue)\b/i },
  { section: "reason_for_visit", label: "Reason for visit stated in the source", pattern: /\b(referral|reason for visit|consultation|assessment requested|referred)\b/i },
];

/** Deterministic RFC-4122-shaped identifier so regenerating a draft is stable. */
function deterministicUuid(seed: string): string {
  const digest = createHash("sha256").update(seed).digest("hex");
  const variant = ((parseInt(digest.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    `4${digest.slice(13, 16)}`,
    `${variant}${digest.slice(17, 20)}`,
    digest.slice(20, 32),
  ].join("-");
}

/**
 * Splits page text into sentences that are safe to quote verbatim. Quotes must
 * appear on the cited page exactly, so the sentence is returned as it occurs in
 * the extracted text.
 */
function sentencesOf(pageText: string): string[] {
  return pageText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 8 && sentence.length <= 1_000);
}

function classify(sentence: string) {
  return sectionRules.find((rule) => rule.pattern.test(sentence));
}

/**
 * Builds a Stage 1 brief draft from extracted source pages.
 *
 * Every emitted fact quotes the sentence it was derived from, so the citation is
 * correct by construction; `evaluateBriefReadiness` still verifies it
 * independently before the version can be approved. No AI provider participates:
 * Stage 1 drafting is deterministic so the review contracts can be tested
 * without model variability.
 */
export function draftBriefFromSources(input: {
  caseId: string;
  versionId: string;
  versionNumber: number;
  sources: BriefSource[];
  generatedAt: string;
}): PreConsultationBrief {
  const facts: BriefFact[] = [];
  const seen = new Set<string>();

  for (const source of input.sources) {
    for (const page of source.pages) {
      for (const sentence of sentencesOf(page.text)) {
        // Checked before appending and across every loop: the schema caps a
        // version at MAX_FACTS, and overflowing it would fail the whole draft.
        if (facts.length >= MAX_FACTS) break;

        const rule = classify(sentence);
        if (!rule) continue;

        // The same statement can be repeated across records; keep the first
        // occurrence so a fact is not duplicated per section.
        const key = `${rule.section}:${sentence.toLocaleLowerCase("en-US")}`;
        if (seen.has(key)) continue;
        seen.add(key);

        facts.push({
          id: deterministicUuid(`${input.versionId}:${source.documentId}:${page.pageNumber}:${rule.section}:${sentence}`),
          section: rule.section,
          label: rule.label,
          value: sentence,
          citations: [{ documentId: source.documentId, pageNumber: page.pageNumber, quote: sentence }],
        });
      }
    }
  }

  if (!facts.length) {
    throw new Error("No factual statement could be attributed to a source page. The draft was not generated.");
  }

  // In a deployment the database re-derives this digest on insert; the value is
  // computed here so the synthetic store and the generated draft agree.
  const contentSha256 = computeBriefContentSha256({ purpose: BRIEF_PURPOSE, facts });

  return preConsultationBriefSchema.parse({
    schemaVersion: BRIEF_SCHEMA_VERSION,
    versionId: input.versionId,
    versionNumber: input.versionNumber,
    caseId: input.caseId,
    specialty: "cardiology",
    consultationType: "first_consultation",
    status: "needs_review",
    generatedAt: input.generatedAt,
    generatedBy: "synthetic_stage_1",
    contentSha256,
    purpose: BRIEF_PURPOSE,
    facts,
    sources: input.sources,
  } satisfies PreConsultationBrief);
}
