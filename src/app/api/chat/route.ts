import { NextRequest } from "next/server";
import { AI_ERROR_REPLY } from "@/lib/constants";
import { applyDeterministicGuardrails } from "@/lib/guardrails";
import { mergeLeadData, normalizeAssistantLeadState } from "@/lib/leadState";
import { notifyTeam } from "@/lib/email";
import { generateAssistantResponse } from "@/lib/openai";
import { buildKnowledgeContext } from "@/lib/prompts";
import {
  ensureConversation,
  getActiveKnowledge,
  getLeadForConversation,
  getRecentMessages,
  saveMessage,
  updateConversationStatus,
  upsertLeadForConversation,
  writeAuditLog,
} from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation } from "@/lib/security";
import { summarizeMessages } from "@/lib/summaries";
import { chatPayloadSchema } from "@/lib/validators";
import type { LeadState } from "@/types/lead";

export async function POST(request: NextRequest) {
  try {
    const originError = rejectCrossOriginMutation(request);
    if (originError) return originError;

    const rateLimitError = enforceRateLimit(request, "chat", { limit: 20, windowMs: 60_000 });
    if (rateLimitError) return rateLimitError;

    const payload = chatPayloadSchema.parse(await request.json());
    const conversationId = payload.conversationId || crypto.randomUUID();
    const visitorId = request.cookies.get("juliana_visitor_id")?.value || crypto.randomUUID();

    await ensureConversation(conversationId, visitorId, payload.metadata?.source || "landing_page");
    await saveMessage(conversationId, "user", payload.message, payload.metadata || {});

    const [knowledgeItems, recentMessages, existingLead] = await Promise.all([
      getActiveKnowledge(),
      getRecentMessages(conversationId),
      getLeadForConversation(conversationId),
    ]);
    const currentState = ((existingLead?.status as LeadState | undefined) || "new") as LeadState;
    const output = await generateAssistantResponse({
      message: payload.message,
      messages: recentMessages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({ role: message.role as "user" | "assistant", content: message.content })),
      knowledge: buildKnowledgeContext(knowledgeItems),
      currentLeadState: currentState,
    });

    const guarded = applyDeterministicGuardrails(payload.message, output);
    const mergedLead = mergeLeadData(
      { ...(existingLead || {}), status: currentState, source: "landing_page" },
      { ...guarded.extractedData, summary: guarded.summary, status: guarded.leadState },
    );
    const state = normalizeAssistantLeadState(guarded, currentState, mergedLead);
    const lead = await upsertLeadForConversation(conversationId, {
      ...mergedLead,
      status: state,
      intent: guarded.intent,
      summary: guarded.summary || summarizeMessages(recentMessages),
      source: "landing_page",
    });

    await updateConversationStatus(conversationId, {
      status: state,
      last_intent: guarded.intent,
      handoff_required: guarded.handoffRequired,
      handoff_reason: guarded.handoffReason,
      summary: guarded.summary,
    });
    await saveMessage(conversationId, "assistant", guarded.reply, {
      intent: guarded.intent,
      leadState: state,
      handoffRequired: guarded.handoffRequired,
    });

    if (guarded.shouldNotifyTeam) {
      await notifyTeam(
        guarded.handoffRequired ? "Atendimento humano solicitado — Juliana Pansardi" : "Novo lead qualificado — Juliana Pansardi",
        lead,
        guarded.summary,
      );
    }

    await writeAuditLog({
      action: "chat.message_processed",
      entityType: "conversation",
      entityId: conversationId,
      metadata: {
        intent: guarded.intent,
        leadStatus: state,
        handoffRequired: guarded.handoffRequired,
        ip: request.headers.get("x-forwarded-for"),
      },
    });

    const response = noStoreJson({
      reply: guarded.reply,
      conversationId,
      leadStatus: state,
      intent: guarded.intent,
      handoffRequired: guarded.handoffRequired,
    });
    response.cookies.set("juliana_visitor_id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error("chat_error", error);
    return noStoreJson(
      {
        reply: AI_ERROR_REPLY,
        conversationId: crypto.randomUUID(),
        leadStatus: "human_handoff",
        intent: "human_handoff",
        handoffRequired: true,
      },
      { status: 200 },
    );
  }
}
