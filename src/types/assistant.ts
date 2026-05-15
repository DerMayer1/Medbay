import type { Intent, Lead, LeadState } from "@/types/lead";

export type AssistantInput = {
  message: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  knowledge: string;
  currentLeadState: LeadState;
};

export type AssistantOutput = {
  reply: string;
  intent: Intent;
  leadState: LeadState;
  extractedData: Partial<Lead>;
  handoffRequired: boolean;
  handoffReason?: string;
  shouldNotifyTeam: boolean;
  shouldCheckCalendar: boolean;
  shouldCreateAppointment: boolean;
  summary?: string;
};
