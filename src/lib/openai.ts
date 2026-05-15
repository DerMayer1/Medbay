import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { AssistantInput, AssistantOutput } from "@/types/assistant";

let client: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
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

export async function generateAssistantResponse(input: AssistantInput): Promise<AssistantOutput> {
  const openai = getOpenAIClient();

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
  if (!raw) throw new Error("OpenAI returned an empty response.");
  return JSON.parse(raw) as AssistantOutput;
}
