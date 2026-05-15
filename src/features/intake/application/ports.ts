import type { AssistantInput, AssistantOutput } from "@/types/assistant";
import type {
  Appointment,
  AuditEvent,
  Conversation,
  IntakeCase,
  KnowledgeBaseItem,
  Message,
  Patient,
} from "@/features/intake/domain/types";

export type CaseRepository = {
  findByConversationId(conversationId: string): Promise<IntakeCase | null>;
  save(intakeCase: IntakeCase): Promise<IntakeCase>;
  list(): Promise<IntakeCase[]>;
  getReviewBundle(id: string): Promise<{
    patient: Patient;
    intakeCase: IntakeCase;
    messages: Message[];
    appointments: Appointment[];
    auditEvents: AuditEvent[];
  } | null>;
};

export type PatientRepository = {
  loadOrCreatePatient(input: { visitorId: string; fields?: IntakeCase["fields"] }): Promise<Patient>;
};

export type ConversationRepository = {
  loadOrCreateConversation(input: {
    conversationId: string;
    visitorId: string;
    source?: string;
  }): Promise<Conversation>;
  saveMessage(input: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<Message>;
  getRecentMessages(conversationId: string, limit?: number): Promise<Message[]>;
  updateStatus(conversationId: string, input: Partial<Conversation> & { handoffReason?: string; summary?: string }): Promise<void>;
};

export type KnowledgeBaseRepository = {
  listActive(): Promise<KnowledgeBaseItem[]>;
};

export type AuditLogger = {
  record(event: AuditEvent): Promise<void>;
  listByEntity?(entityId: string): Promise<AuditEvent[]>;
};

export type AIProvider = {
  generateResponse(input: AssistantInput): Promise<AssistantOutput>;
};

export type NotificationProvider = {
  notifyIntakeEvent(input: { subject: string; intakeCase: IntakeCase; summary?: string }): Promise<unknown>;
};

export type CalendarProvider = {
  requestAppointment(input: {
    intakeCaseId: string;
    preferredTime?: string;
    notes?: string;
  }): Promise<Appointment>;
};

export type IntakeUseCaseDependencies = {
  caseRepository: CaseRepository;
  patientRepository: PatientRepository;
  conversationRepository: ConversationRepository;
  knowledgeBaseRepository: KnowledgeBaseRepository;
  auditLogger: AuditLogger;
  aiProvider: AIProvider;
  notificationProvider: NotificationProvider;
  calendarProvider?: CalendarProvider;
};
