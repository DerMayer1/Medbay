import { CalendarCheck, CalendarX } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime, humanize } from "@/lib/format";

export function AppointmentTable({ appointments }: { appointments: Array<Record<string, unknown>> }) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#1d355f] px-6 py-12 text-center text-sm text-[#94a3b8]">
        No appointments recorded yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#1d355f]/60 overflow-hidden rounded-2xl border border-[#1d355f]/80 bg-[#070e1c]">
      {appointments.map((appointment) => {
        const synced = Boolean(appointment.google_event_id);
        const hasTime = Boolean(appointment.start_time);
        return (
          <li key={String(appointment.id)} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#eef5ff]">
                {hasTime ? formatDateTime(appointment.start_time) : "Awaiting a time slot"}
              </p>
              <p className="mt-1 text-xs text-[#64748b]">
                {hasTime && appointment.end_time ? `Ends ${formatDateTime(appointment.end_time)} · ` : ""}
                {humanize(appointment.modality, "Mode not set")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={appointment.status || "requested"} />
              <span className="inline-flex items-center gap-1.5 text-xs text-[#64748b]">
                {synced ? <CalendarCheck className="h-3.5 w-3.5 text-[#4ade80]" /> : <CalendarX className="h-3.5 w-3.5" />}
                {synced ? "Synced to Google Calendar" : "Not synced to calendar"}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
