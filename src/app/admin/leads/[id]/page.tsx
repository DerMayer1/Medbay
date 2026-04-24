import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ConversationViewer } from "@/components/admin/ConversationViewer";
import { getLeadBundle } from "@/lib/repository";
import type { ChatMessage } from "@/types/lead";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getLeadBundle(id);
  if (!bundle.lead) notFound();

  const lead = bundle.lead as Record<string, unknown>;

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-lg border border-[#d9ded6] bg-white p-5">
          <h1 className="text-2xl font-semibold">{String(lead.name || "Lead sem nome")}</h1>
          <dl className="mt-5 space-y-3 text-sm">
            <Info label="Contato" value={String(lead.phone || lead.email || "Não informado")} />
            <Info label="Tipo" value={String(lead.consultation_type || "Não informado")} />
            <Info label="Objetivo" value={String(lead.goal || "Não informado")} />
            <Info label="Modalidade" value={String(lead.modality || "Não informada")} />
            <Info label="Preferência" value={String(lead.schedule_preference || "Não informada")} />
            <Info label="Status" value={String(lead.status || "new")} />
          </dl>
          <div className="mt-6">
            <h2 className="text-sm font-semibold">Resumo</h2>
            <p className="mt-2 text-sm leading-6 text-[#66746f]">{String(lead.summary || "Sem resumo automático.")}</p>
          </div>
        </aside>
        <ConversationViewer messages={(bundle.messages || []) as ChatMessage[]} />
      </div>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-[#43514c]">{label}</dt>
      <dd className="mt-1 text-[#66746f]">{value}</dd>
    </div>
  );
}
