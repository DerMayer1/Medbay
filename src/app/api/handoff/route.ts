import { NextRequest } from "next/server";
import { notifyTeam } from "@/lib/email";
import { updateConversationStatus, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation } from "@/lib/security";
import { handoffPayloadSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const rateLimitError = enforceRateLimit(request, "handoff", { limit: 5, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;

  const payload = handoffPayloadSchema.parse(await request.json());
  await updateConversationStatus(payload.conversationId, {
    status: "human_handoff",
    handoff_required: true,
    handoff_reason: payload.reason,
  });
  await notifyTeam("Handoff humano solicitado — Juliana Pansardi", { status: "human_handoff" }, payload.reason);
  await writeAuditLog({
    action: "handoff.created",
    entityType: "conversation",
    entityId: payload.conversationId,
    metadata: { reason: payload.reason },
  });
  return noStoreJson({ ok: true });
}
