import { AdminLayout } from "@/components/admin/AdminLayout";
import { KnowledgeEditor } from "@/components/admin/KnowledgeEditor";
import { listKnowledge } from "@/lib/repository";

export default async function KnowledgePage() {
  const items = await listKnowledge();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold">Base de conhecimento</h1>
      <p className="mt-1 text-sm text-[#66746f]">Informações administrativas que a assistente pode usar.</p>
      <div className="mt-6">
        <KnowledgeEditor items={items as Array<Record<string, unknown>>} />
      </div>
    </AdminLayout>
  );
}
