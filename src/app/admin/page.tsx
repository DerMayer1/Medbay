import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { listAppointments, listConversations, listLeads } from "@/lib/repository";

export default async function AdminDashboard() {
  const [leads, conversations, appointments] = await Promise.all([listLeads(), listConversations(), listAppointments()]);
  const waiting = leads.filter((lead) => String(lead.status).includes("confirmation")).length;
  const handoffs = leads.filter((lead) => lead.status === "human_handoff").length;

  const cards = [
    { label: "Total de leads", value: leads.length },
    { label: "Aguardando confirmação", value: waiting },
    { label: "Handoffs pendentes", value: handoffs },
    { label: "Agendamentos", value: appointments.length },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-[#66746f]">Visão operacional dos atendimentos recebidos.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-[#d9ded6] bg-white p-5">
            <p className="text-sm text-[#66746f]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-[#d9ded6] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Conversas recentes</h2>
          <Link href="/admin/conversations" className="text-sm font-semibold text-[#176b4d]">
            Ver todas
          </Link>
        </div>
        <div className="mt-4 divide-y divide-[#edf0ea]">
          {conversations.slice(0, 8).map((conversation) => (
            <div key={String(conversation.id)} className="py-3 text-sm">
              <p className="font-medium">{String(conversation.summary || "Atendimento sem resumo")}</p>
              <p className="mt-1 text-[#66746f]">
                Status {String(conversation.status || "new")} / intenção {String(conversation.last_intent || "other")}
              </p>
            </div>
          ))}
          {conversations.length === 0 ? <p className="py-6 text-sm text-[#66746f]">Sem conversas ainda.</p> : null}
        </div>
      </section>
    </AdminLayout>
  );
}
