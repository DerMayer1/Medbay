import Link from "next/link";
import { Activity, ArrowUpRight, Clock, UserCheck, Users } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { listAppointments, listConversations, listLeads } from "@/lib/repository";

export default async function AdminDashboard() {
  const [leads, conversations, appointments] = await Promise.all([listLeads(), listConversations(), listAppointments()]);
  const waiting = leads.filter((lead) => lead.status === "waiting_human").length;
  const qualified = leads.filter((lead) => lead.status === "qualified").length;
  const scheduled = leads.filter((lead) => lead.status === "scheduled").length + appointments.length;

  const cards = [
    { label: "New leads", value: leads.filter((lead) => lead.status === "new").length, icon: Users },
    { label: "Waiting human handoff", value: waiting, icon: UserCheck },
    { label: "Scheduled appointments", value: scheduled, icon: Clock },
    { label: "Conversion rate", value: qualified ? "42%" : "Demo", icon: Activity },
    { label: "Avg response time", value: "1.8s", icon: Activity },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Operations overview</h1>
          <p className="mt-1 text-sm text-slate-400">Live demo workspace for Northstar Clinic intake operations.</p>
        </div>
        <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
          Review leads
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-white/10 bg-slate-900 p-5">
            <card.icon className="h-5 w-5 text-cyan-200" />
            <p className="mt-4 text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-white/10 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent activity timeline</h2>
          <Link href="/admin/conversations" className="text-sm font-semibold text-cyan-200">
            View conversations
          </Link>
        </div>
        <div className="mt-4 divide-y divide-white/10">
          {conversations.slice(0, 8).map((conversation) => (
            <div key={String(conversation.id)} className="py-3 text-sm">
              <p className="font-medium text-white">{String(conversation.summary || "Conversation captured")}</p>
              <p className="mt-1 text-slate-500">
                Status {String(conversation.status || "new")} / intent {String(conversation.last_intent || "patient_intake")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
