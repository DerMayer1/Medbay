import { NextRequest } from "next/server";
import { createDemoKnowledgeItem, listDemoKnowledge } from "@/lib/demoStore";
import { createKnowledgeItem, listKnowledge, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, resolveAdminAccess } from "@/lib/security";
import { knowledgePayloadSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "admin_knowledge", { limit: 120, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;
  return noStoreJson(access.demo ? listDemoKnowledge() : await listKnowledge());
}

export async function POST(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "admin_knowledge", { limit: 30, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const payload = knowledgePayloadSchema.parse(await request.json());
  if (access.demo) return noStoreJson(createDemoKnowledgeItem(payload));
  const item = await createKnowledgeItem(payload);
  await writeAuditLog({
    action: "knowledge.created",
    entityType: "knowledge_item",
    entityId: item?.id,
    metadata: { category: payload.category, title: payload.title },
  });
  return noStoreJson(item);
}
