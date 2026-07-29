import { NextRequest } from "next/server";
import { AI_ERROR_REPLY } from "@/lib/constants";
import { createDegradedChatReply } from "@/lib/degradedChat";
import { logger } from "@/lib/observability";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation } from "@/lib/security";
import { chatPayloadSchema } from "@/lib/validators";
import { handlePatientMessage } from "@/features/intake/application/handle-patient-message";
import { createIntakeUseCaseDependencies } from "@/features/intake/infrastructure/adapters";

export async function POST(request: NextRequest) {
  let payload: ReturnType<typeof chatPayloadSchema.parse> | undefined;
  const visitorId = request.cookies.get("medbay_visitor_id")?.value || crypto.randomUUID();

  try {
    const originError = rejectCrossOriginMutation(request);
    if (originError) return originError;

    const rateLimitError = enforceRateLimit(request, "chat", { limit: 20, windowMs: 60_000 });
    if (rateLimitError) return rateLimitError;

    payload = chatPayloadSchema.parse(await request.json());

    const result = await handlePatientMessage(
      {
        conversationId: payload.conversationId,
        visitorId,
        message: payload.message,
        metadata: payload.metadata,
      },
      createIntakeUseCaseDependencies(),
    );

    const response = noStoreJson({
      reply: result.reply,
      conversationId: result.conversationId,
      intakeCaseId: result.intakeCaseId,
      caseStatus: result.caseStatus,
      leadStatus: result.caseStatus,
      extractedFields: result.extractedFields,
      policy: result.policy,
      handoffRequired: result.handoffRequired,
      handoffReason: result.handoffReason,
      persistenceAvailable: true,
    });

    response.cookies.set("medbay_visitor_id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    logger.error("chat_error", error, { route: "/api/chat", degraded: Boolean(payload) });

    if (payload) {
      const degraded = createDegradedChatReply(payload.message, payload.history);
      const response = noStoreJson({
        reply: degraded.reply,
        conversationId: payload.conversationId || crypto.randomUUID(),
        caseStatus: degraded.handoffRequired ? "needs_human_review" : "collecting_information",
        leadStatus: degraded.handoffRequired ? "needs_human_review" : "collecting_information",
        policy: degraded.policy,
        handoffRequired: degraded.handoffRequired,
        persistenceAvailable: false,
      });

      response.cookies.set("medbay_visitor_id", visitorId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
      return response;
    }

    return noStoreJson(
      {
        reply: AI_ERROR_REPLY,
        conversationId: crypto.randomUUID(),
        caseStatus: "needs_human_review",
        leadStatus: "needs_human_review",
        handoffRequired: true,
      },
      { status: 200 },
    );
  }
}
