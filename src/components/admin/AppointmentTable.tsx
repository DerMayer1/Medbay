export function AppointmentTable({ appointments }: { appointments: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-[#ffffff]">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[#f5f5f5] text-[#525252]">
          <tr>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Mode</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Google</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ededed] text-[#737373]">
          {appointments.map((appointment) => (
            <tr key={String(appointment.id)}>
              <td className="px-4 py-3">{String(appointment.start_time || "Pending")}</td>
              <td className="px-4 py-3">{String(appointment.end_time || "Pending")}</td>
              <td className="px-4 py-3">{String(appointment.modality || "Not provided")}</td>
              <td className="px-4 py-3">{String(appointment.status || "requested")}</td>
              <td className="px-4 py-3">{String(appointment.google_event_id || "Not synced")}</td>
            </tr>
          ))}
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[#737373]">
                No appointments recorded.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
