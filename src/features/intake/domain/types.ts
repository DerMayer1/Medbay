import type { ChatMessage, KnowledgeItem, PaymentType, UrgencyLevel } from "@/types/lead";

export type Patient = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  contact?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type IntakeCaseStatus =
  | "opened"
  | "collecting_information"
  | "needs_human_review"
  | "ready_for_scheduling"
  | "appointment_requested"
  | "scheduled"
  | "closed"
  | "discarded";

export type IntakeFields = {
  patientName?: string;
  contact?: string;
  email?: string;
  phone?: string;
  reasonForVisit?: string;
  requestedService?: string;
  urgencyLevel?: UrgencyLevel;
  paymentType?: PaymentType;
  availability?: string;
};

export type TriageAssessment = {
  urgencyLevel?: UrgencyLevel;
  riskFlags: string[];
  confidence: number;
  requiresHumanReview: boolean;
};

export type HandoffRequest = {
  id: string;
  intakeCaseId: string;
  reason: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
  resolvedAt?: string;
};

export type AppointmentRequestStatus = "requested" | "under_review" | "slot_offered" | "cancelled";

export type AppointmentRequest = {
  id: string;
  intakeCaseId: string;
  status: AppointmentRequestStatus;
  preferredTime?: string;
  modality?: string;
  notes?: string;
  createdAt: string;
};

export type AppointmentStatus = "requested" | "under_review" | "slot_offered" | "confirmed" | "cancelled" | "completed";

export type Appointment = {
  id: string;
  intakeCaseId?: string;
  patientId?: string;
  startTime?: string;
  endTime?: string;
  status: AppointmentStatus;
  modality?: string;
  externalCalendarEventId?: string;
  notes?: string;
};

export type IntakeCase = {
  id: string;
  patientId?: string;
  conversationId?: string;
  status: IntakeCaseStatus;
  fields: IntakeFields;
  triage?: TriageAssessment;
  handoffRequired: boolean;
  handoffReason?: string;
  summary?: string;
  source: "landing_page" | "demo" | "manual";
  createdAt?: string;
  updatedAt?: string;
};

export type Conversation = {
  id: string;
  patientId?: string;
  intakeCaseId?: string;
  visitorId?: string;
  status?: IntakeCaseStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type Message = ChatMessage;
export type KnowledgeBaseItem = KnowledgeItem;

export type AuditEvent = {
  id?: string;
  actor?: string;
  action:
    | "case_created"
    | "message_received"
    | "policy_evaluated"
    | "intake_extracted"
    | "status_changed"
    | "handoff_requested"
    | "appointment_requested"
    | "notification_sent"
    | "assistant_message_sent";
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type CaseReviewBundle = {
  patient: Patient;
  intakeCase: IntakeCase;
  messages: Message[];
  appointments: Appointment[];
  auditEvents: AuditEvent[];
};
