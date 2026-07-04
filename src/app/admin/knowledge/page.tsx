import { AdminLayout } from "@/components/admin/AdminLayout";
import { KnowledgeEditor } from "@/components/admin/KnowledgeEditor";
import { demoKnowledge, withDemoFallback } from "@/lib/demoData";
import { isPortfolioAdminSession } from "@/lib/portfolioAccess";
import { listKnowledge } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const items = (await isPortfolioAdminSession()) ? demoKnowledge : await withDemoFallback(listKnowledge(), demoKnowledge);

  return (
    <AdminLayout>
      <p className="medbay-label">Assistant source material</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#262626]">Knowledge Base</h1>
      <p className="mt-1 text-sm text-[#737373]">Operational facts used by the intake assistant.</p>
      <div className="mt-6">
        <KnowledgeEditor items={items as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
