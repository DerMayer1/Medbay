"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileCheck2, Link2, XCircle } from "lucide-react";
import {
  evaluateBriefReadiness,
  type BriefReviewStatus,
  type PreConsultationBrief,
} from "@/features/briefs/domain/pre-consultation-brief";

export function PreConsultationBriefReview({ caseId, brief }: { caseId: string; brief: PreConsultationBrief }) {
  const router = useRouter();
  const [status, setStatus] = useState<BriefReviewStatus>(brief.status);
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const readiness = evaluateBriefReadiness(brief);
  const sourceById = new Map(brief.sources.map((source) => [source.documentId, source]));
  const isFinal = status === "approved" || status === "rejected";

  async function review(decision: "approved" | "rejected") {
    if (!reason.trim()) {
      setError("Record a review note before making a final decision.");
      return;
    }

    setIsSaving(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/briefs/${brief.versionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, expectedContentSha256: brief.contentSha256, decision, reason }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) setError(payload.error || "The review decision could not be saved.");
      else {
        setStatus(decision);
        router.refresh();
      }
    } catch {
      setError("The review service could not be reached.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#bfdbfe] bg-white">
      <div className="border-b border-[#dbeafe] bg-[#eff6ff] p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#dbeafe] text-[#1d4ed8]"><FileCheck2 className="h-5 w-5" /></div>
            <div>
              <p className="medbay-label">Synthetic Stage 1 · version {brief.versionNumber}</p>
              <h2 className="mt-2 text-xl font-semibold text-[#262626]">Source-linked pre-consultation brief</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#525252]">{brief.purpose}</p>
            </div>
          </div>
          <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1d4ed8] ring-1 ring-[#bfdbfe]">{status.replace("_", " ")}</span>
        </div>
      </div>

      <div className="grid gap-6 p-5 xl:grid-cols-[1fr_330px]">
        <div>
          <h3 className="text-sm font-semibold text-[#262626]">Extracted factual statements</h3>
          <div className="mt-3 space-y-3">
            {brief.facts.map((fact) => (
              <article key={fact.id} className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#737373]">{fact.label}</p>
                <p className="mt-2 text-sm leading-6 text-[#262626]">{fact.value}</p>
                <div className="mt-3 space-y-2">
                  {fact.citations.map((citation, index) => {
                    const source = sourceById.get(citation.documentId);
                    return (
                      <div key={`${citation.documentId}-${citation.pageNumber}-${index}`} className="rounded-md border border-[#bfdbfe] bg-white px-3 py-2 text-xs text-[#1e3a5f]">
                        <p className="font-semibold"><Link2 className="mr-1 inline h-3 w-3" />{source?.fileName || "Unknown PDF"} · page {citation.pageNumber}</p>
                        <blockquote className="mt-1 leading-5 text-[#525252]">“{citation.quote}”</blockquote>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-[#ededed] p-4">
            <h3 className="text-sm font-semibold text-[#262626]">Born-digital PDF sources</h3>
            <ol className="mt-3 space-y-3">
              {brief.sources.map((source) => (
                <li key={source.documentId} className="text-sm">
                  <p className="font-semibold text-[#262626]">{source.fileName}</p>
                  <p className="mt-1 text-xs text-[#737373]">{source.pages.length} page(s) · SHA-256 {source.documentSha256.slice(0, 12)}…</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#262626]">
              {readiness.readyForReview ? <CheckCircle2 className="h-4 w-4 text-[#16a34a]" /> : <XCircle className="h-4 w-4 text-[#dc2626]" />}
              Deterministic provenance check
            </p>
            <p className="mt-2 text-xs leading-5 text-[#737373]">{readiness.readyForReview ? "Every quote occurs on the referenced extracted PDF page." : readiness.reasons.join(" ")}</p>
          </div>

          {!isFinal ? (
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-[#525252]" htmlFor="review-reason">Clinician review note</label>
              <textarea id="review-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={3} className="rounded-md border border-[#d4d4d4] p-3 text-sm" placeholder="What did you verify or why are you rejecting this version?" />
              <button type="button" disabled={isSaving || !readiness.readyForReview} onClick={() => review("approved")} className="rounded-md bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-45">Approve immutable version</button>
              <button type="button" disabled={isSaving} onClick={() => review("rejected")} className="rounded-md border border-[#fecaca] bg-[#fff7f7] px-4 py-2.5 text-sm font-semibold text-[#b91c1c] disabled:opacity-45">Reject this version</button>
            </div>
          ) : (
            <div className="grid gap-2">
              <p className="rounded-md bg-[#f5f5f5] p-3 text-xs text-[#525252]">This decision is final. Corrections require a new brief version.</p>
              {status === "approved" ? <button type="button" onClick={() => window.print()} className="rounded-md border border-[#bfdbfe] bg-white px-4 py-2.5 text-sm font-semibold text-[#1d4ed8]">Print / export approved brief</button> : null}
            </div>
          )}
          {error ? <p role="alert" className="text-xs leading-5 text-[#b91c1c]">{error}</p> : null}
        </aside>
      </div>
    </section>
  );
}
