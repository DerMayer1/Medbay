import {
  CONFIDENT_NEGATION_CUES,
  HEDGE_CUES,
  HISTORY_CUES,
  RECENT_CUES,
  REMOTE_CUES,
  RESOLUTION_CUES,
  SYMPTOM_CONCEPTS,
  type RedFlagSeverity,
} from "@/features/intake/domain/clinical-red-flags";

export type RedFlagAssessment = {
  /** Null when no red flag survived qualification. */
  severity: RedFlagSeverity | null;
  /** Concept ids that raised the assessment. */
  concepts: string[];
  /** Concept ids removed or downgraded, with the qualifier responsible. */
  qualified: Array<{ concept: string; qualifier: "negated" | "hedged" | "resolved" | "history" }>;
};

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bcan['’]t\b/g, "cannot"],
  [/\bwon['’]t\b/g, "will not"],
  [/\bdon['’]t\b/g, "do not"],
  [/\bdoesn['’]t\b/g, "does not"],
  [/\bdidn['’]t\b/g, "did not"],
  [/\bisn['’]t\b/g, "is not"],
  [/\baren['’]t\b/g, "are not"],
  [/\bwasn['’]t\b/g, "was not"],
  [/\bhaven['’]t\b/g, "have not"],
  [/\bhasn['’]t\b/g, "has not"],
  [/\bhadn['’]t\b/g, "had not"],
  [/\bit['’]s\b/g, "it is"],
  [/\bi['’]m\b/g, "i am"],
  [/\bi['’]ve\b/g, "i have"],
];

/** Lowercases, expands contractions and strips stray punctuation. */
export function normalizeMessage(message: string) {
  let text = message.toLocaleLowerCase("en-US");
  for (const [pattern, replacement] of CONTRACTIONS) text = text.replace(pattern, replacement);
  return text.replace(/['’]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Splits into clauses so a qualifier only applies to the symptom it governs.
 * "I have no chest pain but I am struggling to breathe" must not let the
 * negation reach the second symptom.
 */
function clausesOf(text: string): string[] {
  return text
    .split(/[.,;!?]|\bbut\b|\bhowever\b|\balthough\b|\bthough\b/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function containsAny(text: string, cues: string[]) {
  return cues.some((cue) => new RegExp(`\\b${cue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text));
}

/**
 * True when a negation cue appears before the phrase within the same clause.
 * Position matters: "no chest pain" negates, "chest pain, no relief" does not.
 */
function negatedBefore(clause: string, phraseIndex: number) {
  const preceding = clause.slice(0, phraseIndex);
  return containsAny(preceding, CONFIDENT_NEGATION_CUES);
}

function historyBefore(clause: string, phraseIndex: number) {
  const preceding = clause.slice(0, phraseIndex);
  return containsAny(preceding, HISTORY_CUES);
}

/**
 * Assesses cardiology red flags in a patient message.
 *
 * Order follows the clinical review in issue #3: normalize, match concepts,
 * then apply negation and temporal qualifiers.
 *
 * The governing invariant is asymmetric by design. A matched concept may be
 * de-escalated, but it is only ever dropped entirely by a *confident* whole
 * clause negation or a history construction. An uncertain patient never causes
 * a red flag to disappear silently, because a false negative routes someone
 * with cardiac symptoms into a scheduling queue while a false positive only
 * costs a phone call.
 *
 * Pass `applyQualifiers: false` to match concepts without negation, history or
 * temporal handling. Assistant output validation uses that mode: the question
 * there is whether the model made a clinical assertion at all, not whether a
 * patient is at risk.
 */
export function assessClinicalRedFlags(
  message: string,
  options: { applyQualifiers?: boolean } = {},
): RedFlagAssessment {
  const applyQualifiers = options.applyQualifiers !== false;
  const text = normalizeMessage(message);
  const clauses = clausesOf(text);

  const active = new Map<string, RedFlagSeverity>();
  const qualified: RedFlagAssessment["qualified"] = [];

  // Temporal qualification is judged across the whole message: the resolution
  // often sits in a later clause than the symptom ("chest pain last week and
  // none since").
  const isRecent = containsAny(text, RECENT_CUES);
  const isRemote = containsAny(text, REMOTE_CUES);
  const hasResolved = containsAny(text, RESOLUTION_CUES);
  const remoteAndResolved = applyQualifiers && isRemote && hasResolved && !isRecent;

  for (const concept of SYMPTOM_CONCEPTS) {
    for (const clause of clauses) {
      const hit = concept.phrases
        .map((phrase) => ({ phrase, index: clause.indexOf(phrase) }))
        .find((candidate) => candidate.index >= 0);
      if (!hit) continue;

      if (applyQualifiers) {
        if (historyBefore(clause, hit.index)) {
          qualified.push({ concept: concept.id, qualifier: "history" });
          continue;
        }

        const negated = negatedBefore(clause, hit.index);
        const hedged = containsAny(clause, HEDGE_CUES);

        if (negated && hedged) {
          // Uncertain denial. Keep the concept, but never above review level.
          qualified.push({ concept: concept.id, qualifier: "hedged" });
          active.set(concept.id, "warning");
          continue;
        }
        if (negated) {
          qualified.push({ concept: concept.id, qualifier: "negated" });
          continue;
        }
      }

      const severity = remoteAndResolved && concept.isolated === "critical" ? "warning" : concept.isolated;
      if (remoteAndResolved && concept.isolated === "critical") {
        qualified.push({ concept: concept.id, qualifier: "resolved" });
      }
      // A concept already downgraded by a hedge stays downgraded.
      if (active.get(concept.id) !== "warning" || severity === "warning") {
        active.set(concept.id, active.get(concept.id) === "warning" ? "warning" : severity);
      }
      break;
    }
  }

  if (!active.size) return { severity: null, concepts: [], qualified };

  const concepts = [...active.keys()];
  const escalatingPresent = concepts.some(
    (id) => SYMPTOM_CONCEPTS.find((concept) => concept.id === id)?.escalates,
  );
  const anyCritical = [...active.values()].includes("critical");

  // A nonspecific finding becomes critical only in company: palpitations alone
  // are review-worthy, palpitations with syncope are not.
  const severity: RedFlagSeverity =
    anyCritical || (concepts.length > 1 && escalatingPresent) ? "critical" : "warning";

  return { severity, concepts, qualified };
}
