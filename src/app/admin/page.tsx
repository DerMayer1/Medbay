import Link from "next/link";
import { Activity, ArrowUpRight, Clock, UserCheck, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";
import { withDemoFallback } from "@/lib/demoData";
import { listDemoAppointments, listDemoConversations, listDemoLeads } from "@/lib/demoStore";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { listAppointments, listConversations, listLeads } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const isDemo = await isPortfolioAdminSession();
  const demoLeads = listDemoLeads();
  const demoConversations = listDemoConversations();
  const demoAppointments = listDemoAppointments();
  const [leads, conversations, appointments] = isDemo
    ? [demoLeads, demoConversations, demoAppointments]
    : await Promise.all([
        withDemoFallback(listLeads(), demoLeads),
        withDemoFallback(listConversations(), demoConversations),
        withDemoFallback(listAppointments(), demoAppointments),
      ]);
  const intakeCases = leads.map((lead) => ({ ...lead, caseStatus: legacyStatusToIntakeStatus(lead.status) }));
  const waiting = intakeCases.filter((item) => item.caseStatus === "needs_human_review").length;
  const readyForScheduling = intakeCases.filter((item) => item.caseStatus === "ready_for_scheduling").length;
  const scheduled = intakeCases.filter((item) => item.caseStatus === "scheduled").length + appointments.length;
  const briefsAwaitingReview = leads.filter((item) => item.brief_review_status === "needs_review").length;

  const cards = [
    { label: "Briefs awaiting review", value: briefsAwaitingReview, icon: Users },
    { label: "Needs human review", value: waiting, icon: UserCheck },
    { label: "Scheduled appointments", value: scheduled, icon: Clock },
    { label: "Ready for scheduling", value: readyForScheduling, icon: Activity },
    { label: "Avg response target", value: "1.8s", icon: Activity },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="medbay-label">Demo operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">Operations overview</h1>
          <p className="mt-1 text-sm text-[#737373]">Operations workspace for source-linked pre-consultation preparation.</p>
        </div>
        <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#ffffff]">
          Review visit briefs
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
            <card.icon className="h-5 w-5 text-[#3b82f6]" />
            <p className="mt-4 text-sm text-[#737373]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[#262626]">{card.value}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-[#e5e5e5] bg-[#ffffff] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#262626]">Recent activity timeline</h2>
          <Link href="/admin/conversations" className="text-sm font-semibold text-[#1d4ed8]">
            View conversations
          </Link>
        </div>
        <div className="mt-4 divide-y divide-[#ededed]">
          {conversations.slice(0, 8).map((conversation) => (
            <div key={String(conversation.id)} className="py-3 text-sm">
              <p className="font-medium text-[#262626]">{String(conversation.summary || "Conversation captured")}</p>
              <p className="mt-1 text-[#737373]">
                Status {legacyStatusToIntakeStatus(String(conversation.status || "opened"))} / intent{" "}
                {String(conversation.last_intent || "patient_intake")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
