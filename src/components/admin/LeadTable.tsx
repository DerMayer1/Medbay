"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAllowedNextStatuses } from "@/features/intake/domain/intake-workflow";
import type { IntakeCaseStatus } from "@/features/intake/domain/types";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";
import { humanize } from "@/lib/format";

type Lead = Record<string, unknown>;

function leadFields(lead: Lead) {
  return {
    id: String(lead.id),
    name: String(lead.name || "Unnamed patient"),
    contact: String(lead.contact || lead.phone || lead.email || "Not provided"),
    reason: String(lead.reason_for_visit || lead.goal || "Not provided"),
    service: humanize(lead.preferred_service || lead.consultation_type, "Not routed"),
    urgency: String(lead.urgency_level || "unknown"),
    briefReview: String(lead.brief_review_status || "draft"),
    status: legacyStatusToIntakeStatus(String(lead.status || "opened")),
  };
}

function StatusMover({ status, onChange }: { status: IntakeCaseStatus; onChange: (next: IntakeCaseStatus) => void }) {
  const options = getAllowedNextStatuses(status);
  if (options.length === 0) return null;

  return (
    <select
      aria-label="Move case to another status"
      value=""
      onChange={(event) => onChange(event.target.value as IntakeCaseStatus)}
      className="rounded-lg border border-[#1d355f] bg-[#08101f] px-2 py-1 text-xs text-[#94a3b8] outline-none transition hover:border-[#3b82f6] focus:border-[#60a5fa]"
    >
      <option value="" disabled>
        Move to…
      </option>
      {options.map((nextStatus) => (
        <option key={nextStatus} value={nextStatus}>
          {humanize(nextStatus)}
        </option>
      ))}
    </select>
  );
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  const [localLeads, setLocalLeads] = useState(leads);

  async function updateStatus(id: string, status: IntakeCaseStatus) {
    setLocalLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const rows = localLeads.map(leadFields);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1d355f] px-6 py-12 text-center text-sm text-[#94a3b8]">
        No intake cases yet. New patient conversations will appear here.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-[#1d355f]/80 bg-[#070e1c] lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#1d355f]/80 text-xs uppercase tracking-[0.08em] text-[#64748b]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Patient</th>
              <th className="px-5 py-3.5 font-semibold">Reason for visit</th>
              <th className="px-5 py-3.5 font-semibold">Urgency</th>
              <th className="px-5 py-3.5 font-semibold">Brief</th>
              <th className="px-5 py-3.5 font-semibold">Case status</th>
              <th className="px-5 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1d355f]/60">
            {rows.map((row) => (
              <tr key={row.id} className="group transition hover:bg-[#0b1629]">
                <td className="px-5 py-4 align-top">
                  <Link href={`/admin/leads/${row.id}`} className="font-semibold text-[#eef5ff] hover:text-[#bfdbfe]">
                    {row.name}
                  </Link>
                  <p className="mt-1 text-xs text-[#64748b]">{row.contact}</p>
                </td>
                <td className="max-w-[22rem] px-5 py-4 align-top">
                  <p className="text-[#cbd5e1]">{row.reason}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{row.service}</p>
                </td>
                <td className="px-5 py-4 align-top">
                  <StatusBadge value={row.urgency} />
                </td>
                <td className="px-5 py-4 align-top">
                  <StatusBadge value={row.briefReview} />
                </td>
                <td className="px-5 py-4 align-top">
                  <div className="flex flex-col items-start gap-2">
                    <StatusBadge value={row.status} />
                    <StatusMover status={row.status} onChange={(next) => updateStatus(row.id, next)} />
                  </div>
                </td>
                <td className="px-5 py-4 text-right align-top">
                  <Link
                    href={`/admin/leads/${row.id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#7db7ff] transition hover:bg-[#10264a] hover:text-white"
                  >
                    Review
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-[#1d355f]/80 bg-[#070e1c] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/admin/leads/${row.id}`} className="font-semibold text-[#eef5ff]">
                  {row.name}
                </Link>
                <p className="mt-0.5 truncate text-xs text-[#64748b]">{row.contact}</p>
              </div>
              <StatusBadge value={row.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#cbd5e1]">{row.reason}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge value={row.urgency} label={`${humanize(row.urgency)} urgency`} />
              <StatusBadge value={row.briefReview} label={`Brief: ${humanize(row.briefReview).toLowerCase()}`} />
              <span className="text-xs text-[#64748b]">{row.service}</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1d355f]/60 pt-3">
              <StatusMover status={row.status} onChange={(next) => updateStatus(row.id, next)} />
              <Link href={`/admin/leads/${row.id}`} className="ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-[#7db7ff]">
                Review case
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
