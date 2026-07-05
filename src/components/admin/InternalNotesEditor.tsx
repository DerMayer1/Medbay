"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InternalNotesEditor({ caseId, initialNotes }: { caseId: string; initialNotes?: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function saveNotes() {
    setStatus("saving");
    const response = await fetch(`/api/leads/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });

    setStatus(response.ok ? "saved" : "error");
    if (response.ok) {
      router.refresh();
      window.setTimeout(() => setStatus("idle"), 1800);
    }
  }

  return (
    <div>
      <textarea
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          if (status !== "idle") setStatus("idle");
        }}
        placeholder="Add staff-only follow-up notes for scheduling, care coordination, or handoff context."
        className="h-28 w-full rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-3 text-sm text-[#262626] outline-none focus:border-[#60a5fa]"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveNotes}
          disabled={status === "saving"}
          className="rounded-md border border-[#93c5fd] bg-[#dbeafe] px-3 py-2 text-xs font-semibold text-[#1d4ed8] transition hover:border-[#60a5fa] disabled:opacity-60"
        >
          {status === "saving" ? "Saving..." : "Save notes"}
        </button>
        {status === "saved" ? <span className="text-xs font-semibold text-[#7db7ff]">Saved to demo case.</span> : null}
        {status === "error" ? <span className="text-xs font-semibold text-red-300">Could not save notes.</span> : null}
      </div>
    </div>
  );
}
