import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { listConversations } from "@/lib/repository";

export default async function ConversationsPage() {
  const conversations = await listConversations();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold">Conversas</h1>
      <div className="mt-6 space-y-3">
        {conversations.map((conversation) => (
          <article key={String(conversation.id)} className="rounded-lg border border-[#d9ded6] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#176b4d]">{String(conversation.status || "new")}</p>
                <h2 className="mt-1 text-lg font-semibold">{String(conversation.summary || "Conversa sem resumo")}</h2>
                <p className="mt-2 text-sm text-[#66746f]">Intenção: {String(conversation.last_intent || "other")}</p>
              </div>
              {conversation.lead_id ? (
                <Link className="text-sm font-semibold text-[#176b4d]" href={`/admin/leads/${String(conversation.lead_id)}`}>
                  Abrir lead
                </Link>
              ) : null}
            </div>
          </article>
        ))}
        {conversations.length === 0 ? <p className="text-sm text-[#66746f]">Sem conversas registradas.</p> : null}
      </div>
    </AdminLayout>
  );
}
