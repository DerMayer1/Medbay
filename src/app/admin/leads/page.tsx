import { AdminLayout } from "@/components/admin/AdminLayout";
import { LeadTable } from "@/components/admin/LeadTable";
import { withDemoFallback } from "@/lib/demoData";
import { listDemoLeads } from "@/lib/demoStore";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { listLeads } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const demoLeads = listDemoLeads();
  const leads = (await isPortfolioAdminSession()) ? demoLeads : await withDemoFallback(listLeads(), demoLeads);

  return (
    <AdminLayout>
      <p className="medbay-label">Case queue</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">Visit preparation cases</h1>
      <p className="mt-1 text-sm text-[#737373]">Source-linked patient context, missing records, review decisions, and workflow status.</p>
      <div className="mt-6 overflow-x-auto">
        <LeadTable leads={leads as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
