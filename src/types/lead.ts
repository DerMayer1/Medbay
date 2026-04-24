export type Intent =
  | "schedule_appointment"
  | "reschedule_appointment"
  | "cancel_appointment"
  | "ask_price"
  | "ask_location"
  | "ask_online_or_in_person"
  | "ask_how_it_works"
  | "ask_return_policy"
  | "send_exams"
  | "clinical_question"
  | "human_handoff"
  | "complaint"
  | "other";

export type LeadState =
  | "new"
  | "chatting"
  | "collecting_name"
  | "collecting_consultation_type"
  | "collecting_goal"
  | "collecting_modality"
  | "collecting_schedule_preference"
  | "collecting_contact"
  | "ready_for_human_confirmation"
  | "appointment_suggested"
  | "appointment_confirmed"
  | "human_handoff"
  | "closed";

export type ConsultationType = "first_consultation" | "return" | "unknown";
export type Modality = "online" | "in_person" | "unknown";

export type Lead = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  consultationType?: ConsultationType;
  consultation_type?: ConsultationType;
  goal?: string;
  modality?: Modality;
  schedulePreference?: string;
  schedule_preference?: string;
  status: LeadState;
  intent?: Intent;
  summary?: string;
  source: "landing_page" | "instagram_bio" | "manual";
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type KnowledgeCategory =
  | "prices"
  | "location"
  | "hours"
  | "online_consultation"
  | "in_person_consultation"
  | "first_consultation"
  | "return_consultation"
  | "payment"
  | "cancellation"
  | "exams"
  | "general";

export type KnowledgeItem = {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  active: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export type MessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};
