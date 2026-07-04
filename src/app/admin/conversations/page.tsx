import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";
import { demoConversations, withDemoFallback } from "@/lib/demoData";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { listConversations } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const conversations = (await isPortfolioAdminSession())
    ? demoConversations
    : await withDemoFallback(listConversations(), demoConversations);

  return (
    <AdminLayout>
      <p className="medbay-label">Message history</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">Conversations</h1>
      <div className="mt-6 space-y-3">
        {conversations.map((conversation) => (
          <article key={String(conversation.id)} className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#3b82f6]">
                  {legacyStatusToIntakeStatus(String(conversation.status || "opened"))}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#262626]">{String(conversation.summary || "Conversation captured")}</h2>
                <p className="mt-2 text-sm text-[#737373]">Intent: {String(conversation.last_intent || "patient_intake")}</p>
              </div>
              {conversation.lead_id ? (
                <Link className="text-sm font-semibold text-[#1d4ed8]" href={`/admin/leads/${String(conversation.lead_id)}`}>
                  Open intake case
                </Link>
              ) : null}
            </div>
          </article>
        ))}
        {conversations.length === 0 ? <p className="text-sm text-[#737373]">No conversations recorded.</p> : null}
      </div>
    </AdminLayout>
  );
}
