import { NextRequest } from "next/server";
import { updateDemoKnowledgeItem } from "@/lib/demoStore";
import { updateKnowledgeItem, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, resolveAdminAccess } from "@/lib/security";
import { knowledgePayloadSchema } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = enforceRateLimit(request, "admin_knowledge", { limit: 30, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const { id } = await params;
  const payload = knowledgePayloadSchema.partial().parse(await request.json());
  if (access.demo) return noStoreJson(updateDemoKnowledgeItem(id, payload));
  const item = await updateKnowledgeItem(id, payload);
  await writeAuditLog({
    action: "knowledge.updated",
    entityType: "knowledge_item",
    entityId: id,
    metadata: payload,
  });
  return noStoreJson(item);
}
