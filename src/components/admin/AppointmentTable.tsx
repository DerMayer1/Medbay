export function AppointmentTable({ appointments }: { appointments: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-white/5 text-slate-300">
          <tr>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Mode</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Google</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-slate-400">
          {appointments.map((appointment) => (
            <tr key={String(appointment.id)}>
              <td className="px-4 py-3">{String(appointment.start_time || "Pending")}</td>
              <td className="px-4 py-3">{String(appointment.end_time || "Pending")}</td>
              <td className="px-4 py-3">{String(appointment.modality || "Not provided")}</td>
              <td className="px-4 py-3">{String(appointment.status || "requested")}</td>
              <td className="px-4 py-3">{String(appointment.google_event_id || "Mock / not synced")}</td>
            </tr>
          ))}
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[#66746f]">
                No appointments recorded.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
