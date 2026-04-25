export type Intent =
  | "patient_intake"
  | "schedule_appointment"
  | "reschedule_appointment"
  | "cancel_appointment"
  | "ask_pricing"
  | "ask_location"
  | "ask_services"
  | "ask_hours"
  | "clinical_question"
  | "human_handoff"
  | "complaint"
  | "other";

export type LeadState =
  | "opened"
  | "collecting_information"
  | "needs_human_review"
  | "ready_for_scheduling"
  | "appointment_requested"
  | "new"
  | "collecting_name"
  | "collecting_contact"
  | "collecting_reason"
  | "collecting_service"
  | "collecting_urgency"
  | "collecting_availability"
  | "collecting_payment"
  | "qualified"
  | "waiting_human"
  | "scheduled"
  | "closed"
  | "discarded"
  | "lost"
  | "resolved";

export type UrgencyLevel = "low" | "medium" | "high" | "urgent" | "unknown";
export type PaymentType = "insurance" | "self_pay" | "unknown";

export type Lead = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  contact?: string;
  reasonForVisit?: string;
  reason_for_visit?: string;
  preferredService?: string;
  preferred_service?: string;
  urgencyLevel?: UrgencyLevel;
  urgency_level?: UrgencyLevel;
  availability?: string;
  paymentType?: PaymentType;
  payment_type?: PaymentType;
  handoffRequired?: boolean;
  handoff_required?: boolean;
  status: LeadState;
  intent?: Intent;
  summary?: string;
  source: "landing_page" | "demo" | "manual";
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;

  // Backward-compatible columns from the initial prototype.
  consultationType?: string;
  consultation_type?: string;
  goal?: string;
  modality?: string;
  schedulePreference?: string;
  schedule_preference?: string;
};

export type KnowledgeCategory = "services" | "pricing" | "schedule" | "policies" | "faq" | "safety";

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
