"use client";

import { useState } from "react";
import { getAllowedNextStatuses } from "@/features/intake/domain/intake-workflow";
import type { IntakeCaseStatus } from "@/features/intake/domain/types";

export function CaseStatusControls({ caseId, status }: { caseId: string; status: IntakeCaseStatus }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isSaving, setIsSaving] = useState(false);
  const allowedStatuses = getAllowedNextStatuses(currentStatus);

  async function updateStatus(nextStatus: IntakeCaseStatus) {
    setIsSaving(true);
    const response = await fetch(`/api/leads/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) setCurrentStatus(nextStatus);
    setIsSaving(false);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Workflow controls</h2>
      <p className="mt-2 text-2xl font-semibold text-white">{currentStatus}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {allowedStatuses.map((nextStatus) => (
          <button
            key={nextStatus}
            type="button"
            disabled={isSaving}
            onClick={() => updateStatus(nextStatus)}
            className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-50"
          >
            Move to {nextStatus}
          </button>
        ))}
        {allowedStatuses.length === 0 ? <p className="text-sm text-slate-500">No further transitions available.</p> : null}
      </div>
    </div>
  );
}
