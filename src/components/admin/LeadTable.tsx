import Link from "next/link";

export function LeadTable({ leads }: { leads: Array<Record<string, unknown>> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d9ded6] bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-[#eef4ec] text-[#41504b]">
          <tr>
            <th className="px-4 py-3 font-semibold">Nome</th>
            <th className="px-4 py-3 font-semibold">Contato</th>
            <th className="px-4 py-3 font-semibold">Objetivo</th>
            <th className="px-4 py-3 font-semibold">Modalidade</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0ea]">
          {leads.map((lead) => (
            <tr key={String(lead.id)}>
              <td className="px-4 py-3">{String(lead.name || "Sem nome")}</td>
              <td className="px-4 py-3">{String(lead.phone || lead.email || "Não informado")}</td>
              <td className="px-4 py-3">{String(lead.goal || "Não informado")}</td>
              <td className="px-4 py-3">{String(lead.modality || "Não informada")}</td>
              <td className="px-4 py-3">
                <span className="rounded-md bg-[#eef4ec] px-2 py-1 text-xs font-semibold text-[#176b4d]">
                  {String(lead.status || "new")}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link className="font-semibold text-[#176b4d]" href={`/admin/leads/${String(lead.id)}`}>
                  Ver conversa
                </Link>
              </td>
            </tr>
          ))}
          {leads.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-[#66746f]">
                Nenhum lead registrado ainda.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
