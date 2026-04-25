"use client";

import Link from "next/link";
import { useState } from "react";
import { getAllowedNextStatuses } from "@/features/intake/domain/intake-workflow";
import type { IntakeCaseStatus } from "@/features/intake/domain/types";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";

export function LeadTable({ leads }: { leads: Array<Record<string, unknown>> }) {
  const [localLeads, setLocalLeads] = useState(leads);

  async function updateStatus(id: string, status: IntakeCaseStatus) {
    setLocalLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-semibold">Patient</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Reason</th>
            <th className="px-4 py-3 font-semibold">Service</th>
            <th className="px-4 py-3 font-semibold">Urgency</th>
            <th className="px-4 py-3 font-semibold">Case status</th>
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {localLeads.map((lead) => (
            <tr key={String(lead.id)}>
              <td className="px-4 py-3 text-white">{String(lead.name || "Unnamed patient")}</td>
              <td className="px-4 py-3 text-slate-400">{String(lead.contact || lead.phone || lead.email || "Not provided")}</td>
              <td className="px-4 py-3 text-slate-400">{String(lead.reason_for_visit || lead.goal || "Not provided")}</td>
              <td className="px-4 py-3 text-slate-400">{String(lead.preferred_service || lead.consultation_type || "Not routed")}</td>
              <td className="px-4 py-3 text-slate-400">{String(lead.urgency_level || "unknown")}</td>
              <td className="px-4 py-3">
                {(() => {
                  const status = legacyStatusToIntakeStatus(String(lead.status || "opened"));
                  const options = getAllowedNextStatuses(status);
                  return (
                <select
                  value={status}
                  onChange={(event) => updateStatus(String(lead.id), event.target.value as IntakeCaseStatus)}
                  className="rounded-md border border-white/10 bg-slate-950 px-2 py-1 text-xs font-semibold text-cyan-100"
                >
                  <option value={status}>{status}</option>
                  {options.map((nextStatus) => (
                    <option key={nextStatus} value={nextStatus}>
                      {nextStatus}
                    </option>
                  ))}
                </select>
                  );
                })()}
              </td>
              <td className="px-4 py-3">
                <Link className="font-semibold text-cyan-200" href={`/admin/leads/${String(lead.id)}`}>
                  Review case
                </Link>
              </td>
            </tr>
          ))}
          {localLeads.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                No intake leads yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
