import { createHash } from "node:crypto";
import type { PreConsultationBrief } from "@/features/briefs/domain/pre-consultation-brief";

export type BriefContent = Pick<PreConsultationBrief, "purpose" | "facts">;

/**
 * Canonical rendering of the factual payload of a brief version. Object keys
 * are sorted and insignificant whitespace is removed so identical content
 * always produces an identical digest.
 */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Brief content contains a non-finite number.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  throw new Error("Brief content contains a value that cannot be hashed.");
}

/**
 * Digest of the content a clinician actually reviews. Only `purpose` and
 * `facts` participate: every other brief field is either a database column or
 * review metadata written after the content is frozen.
 *
 * In a Supabase deployment the authoritative digest is produced by the
 * database from `content::text` (see `005_pre_consultation_briefs.sql`). Each
 * store is internally consistent, so the two renderings are not required to be
 * byte-identical.
 */
export function computeBriefContentSha256(content: BriefContent): string {
  return createHash("sha256")
    .update(canonicalJson({ purpose: content.purpose, facts: content.facts }))
    .digest("hex");
}
