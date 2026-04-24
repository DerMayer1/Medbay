import OpenAI from "openai";
import { extractLeadByState } from "@/lib/extraction";
import { classifyIntent } from "@/lib/guardrails";
import { getNextLeadState } from "@/lib/leadState";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { AssistantInput, AssistantOutput } from "@/types/assistant";

let client: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const assistantSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "reply",
    "intent",
    "leadState",
    "extractedData",
    "handoffRequired",
    "shouldNotifyTeam",
    "shouldCheckCalendar",
    "shouldCreateAppointment",
  ],
  properties: {
    reply: { type: "string" },
    intent: {
      type: "string",
      enum: [
        "schedule_appointment",
        "reschedule_appointment",
        "cancel_appointment",
        "ask_price",
        "ask_location",
        "ask_online_or_in_person",
        "ask_how_it_works",
        "ask_return_policy",
        "send_exams",
        "clinical_question",
        "human_handoff",
        "complaint",
        "other",
      ],
    },
    leadState: {
      type: "string",
      enum: [
        "new",
        "chatting",
        "collecting_name",
        "collecting_consultation_type",
        "collecting_goal",
        "collecting_modality",
        "collecting_schedule_preference",
        "collecting_contact",
        "ready_for_human_confirmation",
        "appointment_suggested",
        "appointment_confirmed",
        "human_handoff",
        "closed",
      ],
    },
    extractedData: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        consultationType: { type: "string", enum: ["first_consultation", "return", "unknown"] },
        goal: { type: "string" },
        modality: { type: "string", enum: ["online", "in_person", "unknown"] },
        schedulePreference: { type: "string" },
      },
    },
    handoffRequired: { type: "boolean" },
    handoffReason: { type: "string" },
    shouldNotifyTeam: { type: "boolean" },
    shouldCheckCalendar: { type: "boolean" },
    shouldCreateAppointment: { type: "boolean" },
    summary: { type: "string" },
  },
};

export function fallbackAssistantResponse(input: AssistantInput): AssistantOutput {
  const intent = classifyIntent(input.message);
  const extractedData = extractLeadByState(input.message, input.currentLeadState);
  const nextState = getNextLeadState(input.currentLeadState, extractedData, intent);

  const isSchedulingFlow =
    intent === "schedule_appointment" ||
    [
      "collecting_name",
      "collecting_consultation_type",
      "collecting_goal",
      "collecting_modality",
      "collecting_schedule_preference",
      "collecting_contact",
    ].includes(input.currentLeadState);

  if (isSchedulingFlow) {
    const questions: Record<string, string> = {
      collecting_name: "Claro. Para começar, me envie seu nome completo.",
      collecting_consultation_type: "Perfeito. É primeira consulta ou retorno?",
      collecting_goal: "Qual é o principal objetivo do atendimento?",
      collecting_modality: "Você prefere atendimento online ou presencial?",
      collecting_schedule_preference: "Qual dia ou período costuma funcionar melhor para você?",
      collecting_contact: "Para a equipe retornar, me envie seu telefone ou e-mail.",
      ready_for_human_confirmation:
        "Recebi as informações principais. Vou encaminhar para a equipe confirmar os horários disponíveis.",
    };
    return {
      reply: questions[nextState] ?? questions.collecting_name,
      intent: intent === "other" ? "schedule_appointment" : intent,
      leadState: nextState,
      extractedData,
      handoffRequired: false,
      shouldNotifyTeam: nextState === "ready_for_human_confirmation",
      shouldCheckCalendar: nextState === "ready_for_human_confirmation",
      shouldCreateAppointment: false,
      summary: input.message,
    };
  }

  if (intent === "human_handoff") {
    return {
      reply: "Sem problema. Vou encaminhar sua mensagem para a equipe da Juliana retornar.",
      intent,
      leadState: "human_handoff",
      extractedData,
      handoffRequired: true,
      handoffReason: "human_handoff",
      shouldNotifyTeam: true,
      shouldCheckCalendar: false,
      shouldCreateAppointment: false,
      summary: input.message,
    };
  }

  return {
    reply:
      "Posso ajudar com agendamento, valores, modalidades, endereço e dúvidas administrativas. Se quiser marcar uma consulta, posso coletar seus dados agora.",
    intent,
    leadState: nextState,
    extractedData,
    handoffRequired: false,
    shouldNotifyTeam: false,
    shouldCheckCalendar: false,
    shouldCreateAppointment: false,
    summary: input.message,
  };
}

export async function generateAssistantResponse(input: AssistantInput): Promise<AssistantOutput> {
  const openai = getOpenAIClient();
  if (!openai) return fallbackAssistantResponse(input);

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    instructions: SYSTEM_PROMPT,
    input: `Base de conhecimento administrativa:\n${input.knowledge}\n\nEstado atual do lead: ${input.currentLeadState}\n\nHistórico recente:\n${input.messages
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n")}\n\nMensagem atual: ${input.message}`,
    text: {
      format: {
        type: "json_schema",
        name: "assistant_output",
        strict: false,
        schema: assistantSchema,
      },
    },
  });

  const raw = response.output_text;
  if (!raw) return fallbackAssistantResponse(input);
  return JSON.parse(raw) as AssistantOutput;
}
