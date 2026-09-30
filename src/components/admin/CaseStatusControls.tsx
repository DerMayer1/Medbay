"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAllowedNextStatuses } from "@/features/intake/domain/intake-workflow";
import type { IntakeCaseStatus } from "@/features/intake/domain/types";
import { humanize } from "@/lib/format";

export function CaseStatusControls({ caseId, status }: { caseId: string; status: IntakeCaseStatus }) {
  const router = useRouter();
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
    if (response.ok) {
      setCurrentStatus(nextStatus);
      router.refresh();
    }
    setIsSaving(false);
  }

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
      <h2 className="medbay-label">Workflow controls</h2>
      <div className="mt-3">
        <StatusBadge value={currentStatus} className="px-3 py-1 text-sm" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Move case to</p>
      <div className="mt-2 grid gap-2">
        {allowedStatuses.map((nextStatus) => (
          <button
            key={nextStatus}
            type="button"
            disabled={isSaving}
            onClick={() => updateStatus(nextStatus)}
            className="group flex items-center justify-between rounded-lg border border-[#1d355f] bg-[#08101f] px-3 py-2 text-left text-sm font-medium text-[#dceafe] transition hover:border-[#3b82f6] hover:bg-[#10264a] disabled:opacity-50"
          >
            {humanize(nextStatus)}
            <ArrowRight className="h-4 w-4 text-[#60a5fa] transition group-hover:translate-x-0.5" />
          </button>
        ))}
        {allowedStatuses.length === 0 ? <p className="text-sm text-[#737373]">No further transitions available.</p> : null}
      </div>
    </div>
  );
}
