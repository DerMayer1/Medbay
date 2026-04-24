export function AppointmentTable({ appointments }: { appointments: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d9ded6] bg-white">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[#eef4ec]">
          <tr>
            <th className="px-4 py-3">Início</th>
            <th className="px-4 py-3">Fim</th>
            <th className="px-4 py-3">Modalidade</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Google</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0ea]">
          {appointments.map((appointment) => (
            <tr key={String(appointment.id)}>
              <td className="px-4 py-3">{String(appointment.start_time || "Pendente")}</td>
              <td className="px-4 py-3">{String(appointment.end_time || "Pendente")}</td>
              <td className="px-4 py-3">{String(appointment.modality || "Não informada")}</td>
              <td className="px-4 py-3">{String(appointment.status || "pending_confirmation")}</td>
              <td className="px-4 py-3">{String(appointment.google_event_id || "Não sincronizado")}</td>
            </tr>
          ))}
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[#66746f]">
                Nenhum agendamento registrado.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
