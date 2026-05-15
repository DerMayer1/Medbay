import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadTable } from "@/components/admin/LeadTable";
import { listLeads } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await listLeads();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-white">Intake Cases</h1>
      <p className="mt-1 text-sm text-slate-400">Structured, auditable patient intake cases and workflow status.</p>
      <div className="mt-6 overflow-x-auto">
        <LeadTable leads={leads as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
