/**
 * Clinical red-flag vocabulary for cardiology intake.
 *
 * This file is clinical content, not logic. It is intended to be reviewed and
 * revised by a clinician without reading the matching engine in
 * `red-flag-detection.ts`. Adding a phrase or changing a severity here should
 * never require a code change elsewhere.
 *
 * Reviewed against issue #3 with @goktugozkanmd (2026-07-29).
 *
 * Severity meanings:
 *   critical — emergency guidance shown, case routed to a human, never scheduled
 *   warning  — routed to a human for review, never auto-scheduled, no emergency text
 *
 * Phrases are matched after normalization: lowercased, contractions expanded
 * ("can't" becomes "cannot"), punctuation reduced to clause breaks. Write
 * phrases in their expanded form.
 */

export type RedFlagSeverity = "critical" | "warning";

export type SymptomConcept = {
  /** Stable identifier, surfaced in policy flags and audit metadata. */
  id: string;
  /** Severity when this concept appears with no other red flag present. */
  isolated: RedFlagSeverity;
  /**
   * Whether the presence of this concept escalates an otherwise nonspecific
   * one. Chest, breathing and syncope findings do; so do the classic
   * associated symptoms. Isolated nonspecific findings do not escalate
   * each other.
   */
  escalates: boolean;
  phrases: string[];
};

export const SYMPTOM_CONCEPTS: SymptomConcept[] = [
  {
    id: "chest_discomfort",
    isolated: "critical",
    escalates: true,
    phrases: [
      "chest pain",
      "chest pains",
      "chest tightness",
      "chest is tight",
      "tight chest",
      "tightness in my chest",
      "chest pressure",
      "pressure in my chest",
      "pressure in the chest",
      "chest discomfort",
      "chest heaviness",
      "chest feels heavy",
      "heaviness in my chest",
      "squeezing in my chest",
      "squeezing in the chest",
      "chest feels squeezed",
      "angina",
    ],
  },
  {
    id: "dyspnea",
    isolated: "critical",
    escalates: true,
    phrases: [
      "shortness of breath",
      "short of breath",
      "cannot breathe",
      "can not breathe",
      "cannot catch my breath",
      "catch my breath",
      "trouble breathing",
      "difficulty breathing",
      "difficult to breathe",
      "breathing feels difficult",
      "hard to breathe",
      "struggling to breathe",
      "breathless",
      "winded",
    ],
  },
  {
    id: "syncope",
    isolated: "critical",
    escalates: true,
    phrases: [
      "fainted",
      "fainting",
      "passed out",
      "blacked out",
      "syncope",
      "unconscious",
      "lost consciousness",
    ],
  },
  {
    // Classic associated findings. Alone they warrant human review rather than
    // emergency guidance, but alongside any other red flag they are escalating.
    id: "associated_symptoms",
    isolated: "warning",
    escalates: true,
    phrases: [
      "dizziness",
      "dizzy",
      "lightheaded",
      "light headed",
      "presyncope",
      "nearly fainted",
      "cold sweat",
      "cold sweats",
      "sweating profusely",
      "diaphoresis",
      "nausea with chest",
    ],
  },
  {
    // Nonspecific in isolation. Escalated only by the concepts above.
    id: "nonspecific_cardiac",
    isolated: "warning",
    escalates: false,
    phrases: [
      "palpitations",
      "heart racing",
      "racing heart",
      "skipped beats",
      "fluttering in my chest",
      "jaw pain",
      "jaw hurts",
      "jaw has been hurting",
      "arm pain",
      "arm hurts",
      "radiating arm pain",
      "pain in my left arm",
    ],
  },
];

/**
 * Cues that a symptom is being denied outright. A confident negation clears the
 * concept entirely.
 */
export const CONFIDENT_NEGATION_CUES = [
  "no",
  "not",
  "none",
  "never",
  "without",
  "denies",
  "denied",
  "deny",
];

/**
 * Cues that the patient is uncertain. These must never clear a concept — an
 * unreliable negation is not a reason to drop a red flag, only to de-escalate
 * it to human review.
 */
export const HEDGE_CUES = [
  "do not think",
  "does not think",
  "not sure",
  "unsure",
  "maybe",
  "might be",
  "may be",
  "probably",
  "possibly",
  "i doubt",
  "hard to say",
];

/** Markers placing a symptom in the present or very recent past. */
export const RECENT_CUES = [
  "now",
  "right now",
  "just now",
  "currently",
  "ongoing",
  "still",
  "today",
  "tonight",
  "this morning",
  "this afternoon",
  "this evening",
  "minutes ago",
  "minute ago",
  "hours ago",
  "hour ago",
  "since this morning",
];

/** Markers placing a symptom clearly in the past. */
export const REMOTE_CUES = [
  "last week",
  "last month",
  "last year",
  "weeks ago",
  "week ago",
  "months ago",
  "month ago",
  "years ago",
  "year ago",
  "a while ago",
  "previously",
  "in the past",
];

/** Markers that the symptom has resolved and not recurred. */
export const RESOLUTION_CUES = [
  "none since",
  "no since",
  "not since",
  "nothing since",
  "gone since",
  "fine since",
  "stopped since",
  "no longer",
  "has not happened since",
  "has not returned",
  "resolved",
];

/**
 * Cues that a condition is being reported as medical history rather than a
 * current complaint. A history mention with no current symptom assertion does
 * not raise a red flag.
 */
export const HISTORY_CUES = [
  "history of",
  "hx of",
  "past medical history",
  "known",
  "diagnosed with",
  "previously diagnosed",
];
