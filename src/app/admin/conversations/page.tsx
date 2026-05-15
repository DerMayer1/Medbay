import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";
import { listConversations } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const conversations = await listConversations();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-white">Conversations</h1>
      <div className="mt-6 space-y-3">
        {conversations.map((conversation) => (
          <article key={String(conversation.id)} className="rounded-xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-200">
                  {legacyStatusToIntakeStatus(String(conversation.status || "opened"))}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">{String(conversation.summary || "Conversation captured")}</h2>
                <p className="mt-2 text-sm text-slate-500">Intent: {String(conversation.last_intent || "patient_intake")}</p>
              </div>
              {conversation.lead_id ? (
                <Link className="text-sm font-semibold text-cyan-200" href={`/admin/leads/${String(conversation.lead_id)}`}>
                  Open intake case
                </Link>
              ) : null}
            </div>
          </article>
        ))}
        {conversations.length === 0 ? <p className="text-sm text-slate-500">No conversations recorded.</p> : null}
      </div>
    </AdminLayout>
  );
}
