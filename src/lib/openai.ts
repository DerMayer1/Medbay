import OpenAI from "openai";
import { isDemoMode } from "@/lib/constants";
import { extractLeadByState } from "@/lib/extraction";
import { classifyIntent } from "@/lib/guardrails";
import { getNextLeadState } from "@/lib/leadState";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { AssistantInput, AssistantOutput } from "@/types/assistant";

let client: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY || isDemoMode()) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const leadStates = [
  "new",
  "collecting_name",
  "collecting_contact",
  "collecting_reason",
  "collecting_service",
  "collecting_urgency",
  "collecting_availability",
  "collecting_payment",
  "qualified",
  "waiting_human",
  "scheduled",
  "lost",
  "resolved",
];

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
        "patient_intake",
        "schedule_appointment",
        "reschedule_appointment",
        "cancel_appointment",
        "ask_pricing",
        "ask_location",
        "ask_services",
        "ask_hours",
        "clinical_question",
        "human_handoff",
        "complaint",
        "other",
      ],
    },
    leadState: { type: "string", enum: leadStates },
    extractedData: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        contact: { type: "string" },
        reasonForVisit: { type: "string" },
        preferredService: { type: "string" },
        urgencyLevel: { type: "string", enum: ["low", "medium", "high", "urgent", "unknown"] },
        availability: { type: "string" },
        paymentType: { type: "string", enum: ["insurance", "self_pay", "unknown"] },
        handoffRequired: { type: "boolean" },
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
  const isIntakeFlow =
    intent === "patient_intake" ||
    intent === "schedule_appointment" ||
    [
      "collecting_name",
      "collecting_contact",
      "collecting_reason",
      "collecting_service",
      "collecting_urgency",
      "collecting_availability",
      "collecting_payment",
    ].includes(input.currentLeadState);

  if (isIntakeFlow) {
    const questions: Record<string, string> = {
      collecting_name: "I can help with intake. What is the patient's full name?",
      collecting_contact: "What is the best contact information for follow-up?",
      collecting_reason: "What is the main reason for the visit?",
      collecting_service: "Which service or specialty should this be routed to?",
      collecting_urgency: "How urgent is this request: low, medium, high, or urgent?",
      collecting_availability: "What days or times are best for an appointment?",
      collecting_payment: "Will this be insurance or self-pay?",
      qualified: "I have the intake details needed. I’ll create a qualified lead and route it to clinic operations.",
    };
    return {
      reply: questions[nextState] || questions.collecting_name,
      intent: intent === "other" ? "patient_intake" : intent,
      leadState: nextState,
      extractedData,
      handoffRequired: false,
      shouldNotifyTeam: nextState === "qualified",
      shouldCheckCalendar: nextState === "qualified",
      shouldCreateAppointment: false,
      summary: input.message,
    };
  }

  if (intent === "human_handoff") {
    return {
      reply: "I’ll route this to the clinic operations team for human follow-up.",
      intent,
      leadState: "waiting_human",
      extractedData: { ...extractedData, handoffRequired: true },
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
      "I can help with intake, scheduling questions, clinic services, pricing policies, and human handoff. Would you like to start a new patient intake?",
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

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: SYSTEM_PROMPT,
      input: `Clinic knowledge base:\n${input.knowledge}\n\nCurrent intake state: ${input.currentLeadState}\n\nRecent conversation:\n${input.messages
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n")}\n\nCurrent user message: ${input.message}`,
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
  } catch (error) {
    console.error("openai_response_error", error);
    return fallbackAssistantResponse(input);
  }
}
