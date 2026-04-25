import { describe, expect, it } from "vitest";
import { handlePatientMessage } from "@/features/intake/application/handle-patient-message";
import type { IntakeUseCaseDependencies } from "@/features/intake/application/ports";
import type { AuditEvent, IntakeCase, Message, Patient } from "@/features/intake/domain/types";

function createTestDependencies(): IntakeUseCaseDependencies & { audits: AuditEvent[]; cases: Map<string, IntakeCase> } {
  const cases = new Map<string, IntakeCase>();
  const messages = new Map<string, Message[]>();
  const audits: AuditEvent[] = [];

  return {
    cases,
    audits,
    caseRepository: {
      findByConversationId: async (conversationId) =>
        Array.from(cases.values()).find((intakeCase) => intakeCase.conversationId === conversationId) || null,
      save: async (intakeCase) => {
        cases.set(intakeCase.id, intakeCase);
        return intakeCase;
      },
      list: async () => Array.from(cases.values()),
      getReviewBundle: async () => null,
    },
    patientRepository: {
      loadOrCreatePatient: async (input): Promise<Patient> => ({ id: input.visitorId, contact: input.fields?.contact }),
    },
    conversationRepository: {
      loadOrCreateConversation: async (input) => ({ id: input.conversationId, visitorId: input.visitorId }),
      saveMessage: async (input) => {
        const message: Message = {
          id: crypto.randomUUID(),
          conversation_id: input.conversationId,
          role: input.role,
          content: input.content,
          metadata: input.metadata,
          created_at: new Date().toISOString(),
        };
        messages.set(input.conversationId, [...(messages.get(input.conversationId) || []), message]);
        return message;
      },
      getRecentMessages: async (conversationId) => messages.get(conversationId) || [],
      updateStatus: async () => undefined,
    },
    knowledgeBaseRepository: {
      listActive: async () => [],
    },
    auditLogger: {
      record: async (event) => {
        audits.push(event);
      },
    },
    aiProvider: {
      generateResponse: async () => ({
        reply: "What is the patient's full name?",
        intent: "patient_intake",
        leadState: "collecting_name",
        extractedData: {},
        handoffRequired: false,
        shouldNotifyTeam: false,
        shouldCheckCalendar: false,
        shouldCreateAppointment: false,
      }),
    },
    notificationProvider: {
      notifyIntakeEvent: async () => ({ mocked: true }),
    },
  };
}

describe("handlePatientMessage", () => {
  it("creates an intake case and records audit events", async () => {
    const dependencies = createTestDependencies();
    const result = await handlePatientMessage(
      {
        conversationId: "11111111-1111-4111-8111-111111111111",
        visitorId: "visitor-1",
        message: "Start a new patient intake",
      },
      dependencies,
    );

    expect(result.caseStatus).toBe("collecting_information");
    expect(dependencies.cases.size).toBe(1);
    expect(dependencies.audits.map((event) => event.action)).toContain("case_created");
    expect(dependencies.audits.map((event) => event.action)).toContain("policy_evaluated");
  });

  it("routes unsafe clinical requests to human review", async () => {
    const dependencies = createTestDependencies();
    const result = await handlePatientMessage(
      {
        conversationId: "22222222-2222-4222-8222-222222222222",
        visitorId: "visitor-2",
        message: "Can you interpret my lab result?",
      },
      dependencies,
    );

    expect(result.caseStatus).toBe("needs_human_review");
    expect(result.handoffRequired).toBe(true);
  });
});
