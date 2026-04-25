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
        <aside className="rounded-xl border border-white/10 bg-slate-900 p-5">
          <h1 className="text-2xl font-semibold text-white">{String(lead.name || "Unnamed patient")}</h1>
          <dl className="mt-5 space-y-3 text-sm">
            <Info label="Contact" value={String(lead.contact || lead.phone || lead.email || "Not provided")} />
            <Info label="Reason" value={String(lead.reason_for_visit || lead.goal || "Not provided")} />
            <Info label="Service" value={String(lead.preferred_service || lead.consultation_type || "Not routed")} />
            <Info label="Urgency" value={String(lead.urgency_level || "unknown")} />
            <Info label="Availability" value={String(lead.availability || lead.schedule_preference || "Not provided")} />
            <Info label="Payment" value={String(lead.payment_type || "unknown")} />
            <Info label="Status" value={String(lead.status || "new")} />
          </dl>
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-white">AI summary</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{String(lead.summary || "No AI summary yet.")}</p>
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
      <dt className="font-semibold text-slate-300">{label}</dt>
      <dd className="mt-1 text-slate-500">{value}</dd>
    </div>
  );
}
