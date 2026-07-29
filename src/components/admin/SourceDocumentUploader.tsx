"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, RefreshCw } from "lucide-react";
import type { BriefSource } from "@/features/briefs/domain/pre-consultation-brief";

const MAX_DOCUMENTS = 5;

export function SourceDocumentUploader({ caseId, hasBrief }: { caseId: string; hasBrief: boolean }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [sources, setSources] = useState<BriefSource[]>([]);
  const [busy, setBusy] = useState<"idle" | "uploading" | "generating">("idle");
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    fetch(`/api/intake-cases/${caseId}/documents`)
      .then((response) => (response.ok ? response.json() : { sources: [] }))
      .then((payload: { sources?: BriefSource[] }) => {
        if (active) setSources(payload.sources || []);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [caseId]);

  async function upload(file: File) {
    setBusy("uploading");
    setError(undefined);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/intake-cases/${caseId}/documents`, { method: "POST", body });
      const payload = (await response.json().catch(() => ({}))) as { source?: BriefSource; error?: string };
      if (!response.ok) setError(payload.error || "The document could not be attached.");
      else if (payload.source) setSources((current) => [...current, payload.source as BriefSource]);
    } catch {
      setError("The upload service could not be reached.");
    } finally {
      setBusy("idle");
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function generate() {
    setBusy("generating");
    setError(undefined);
    try {
      const response = await fetch(`/api/intake-cases/${caseId}/brief`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) setError(payload.error || "The brief version could not be generated.");
      else router.refresh();
    } catch {
      setError("The generation service could not be reached.");
    } finally {
      setBusy("idle");
    }
  }

  const atCapacity = sources.length >= MAX_DOCUMENTS;

  return (
    <section className="rounded-xl border border-[#ededed] bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f5f5f5] text-[#525252]"><FileUp className="h-5 w-5" /></div>
        <div>
          <h2 className="text-base font-semibold text-[#262626]">Born-digital source records</h2>
          <p className="mt-1 text-sm leading-6 text-[#737373]">
            Attach up to {MAX_DOCUMENTS} born-digital PDFs, then generate a version for clinician review. Scanned or image-only
            PDFs are rejected: Stage 1 does not perform OCR.
          </p>
        </div>
      </div>

      {sources.length ? (
        <ol className="mt-4 space-y-2">
          {sources.map((source) => (
            <li key={source.documentId} className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-[#ededed] bg-[#fafafa] px-3 py-2 text-sm">
              <span className="font-medium text-[#262626]">{source.fileName}</span>
              <span className="text-xs text-[#737373]">{source.pages.length} page(s) · SHA-256 {source.documentSha256.slice(0, 12)}…</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-md bg-[#fafafa] px-3 py-2 text-sm text-[#737373]">No source documents are attached yet.</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          disabled={busy !== "idle" || atCapacity}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#f5f5f5] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#262626] disabled:opacity-45"
        />
        <button
          type="button"
          disabled={busy !== "idle" || !sources.length}
          onClick={() => void generate()}
          className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-45"
        >
          {busy === "generating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {hasBrief ? "Generate corrected version" : "Generate brief version"}
        </button>
        {busy === "uploading" ? <span className="text-xs text-[#737373]">Extracting pages…</span> : null}
      </div>

      {atCapacity ? <p className="mt-3 text-xs text-[#737373]">This case has reached the Stage 1 limit of {MAX_DOCUMENTS} source documents.</p> : null}
      {error ? <p role="alert" className="mt-3 text-xs leading-5 text-[#b91c1c]">{error}</p> : null}
    </section>
  );
}
