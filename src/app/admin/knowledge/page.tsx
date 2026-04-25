import { AdminLayout } from "@/components/admin/AdminLayout";
import { KnowledgeEditor } from "@/components/admin/KnowledgeEditor";
import { listKnowledge } from "@/lib/repository";

export default async function KnowledgePage() {
  const items = await listKnowledge();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-white">Knowledge Base</h1>
      <p className="mt-1 text-sm text-slate-400">Operational facts used by the intake assistant.</p>
      <div className="mt-6">
        <KnowledgeEditor items={items as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
