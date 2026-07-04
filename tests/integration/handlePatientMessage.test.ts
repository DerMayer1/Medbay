import { describe, expect, it } from "vitest";
import { handlePatientMessage } from "@/features/intake/application/handle-patient-message";
import type { IntakeUseCaseDependencies } from "@/features/intake/application/ports";
import type { Appointment, AuditEvent, IntakeCase, Message, Patient } from "@/features/intake/domain/types";

function createTestDependencies(): IntakeUseCaseDependencies & {
  appointments: Appointment[];
  audits: AuditEvent[];
  cases: Map<string, IntakeCase>;
} {
  const cases = new Map<string, IntakeCase>();
  const messages = new Map<string, Message[]>();
  const audits: AuditEvent[] = [];
  const appointments: Appointment[] = [];

  return {
    appointments,
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
      notifyIntakeEvent: async () => ({ queued: true }),
    },
    calendarProvider: {
      requestAppointment: async (input) => {
        const appointment: Appointment = {
          id: crypto.randomUUID(),
          intakeCaseId: input.intakeCaseId,
          status: "requested",
          notes: input.notes,
        };
        appointments.push(appointment);
        return appointment;
      },
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

  it("persists an appointment request when a complete case asks to schedule", async () => {
    const dependencies = createTestDependencies();
    const conversationId = "33333333-3333-4333-8333-333333333333";
    dependencies.cases.set("case-1", {
      id: "case-1",
      conversationId,
      patientId: "visitor-3",
      status: "ready_for_scheduling",
      fields: {
        patientName: "Ada Patient",
        contact: "ada@example.com",
        email: "ada@example.com",
        reasonForVisit: "Routine primary care visit",
        requestedService: "primary care",
        urgencyLevel: "low",
        paymentType: "insurance",
        availability: "Monday morning",
      },
      handoffRequired: false,
      source: "landing_page",
    });

    const result = await handlePatientMessage(
      {
        conversationId,
        visitorId: "visitor-3",
        message: "Please schedule an appointment.",
      },
      dependencies,
    );

    expect(result.caseStatus).toBe("appointment_requested");
    expect(dependencies.appointments).toHaveLength(1);
    expect(dependencies.appointments[0].intakeCaseId).toBe("case-1");
    expect(dependencies.appointments[0].notes).toContain("Monday morning");
    expect(dependencies.audits).toContainEqual(
      expect.objectContaining({
        action: "appointment_requested",
        metadata: expect.objectContaining({ persisted: true }),
      }),
    );
  });
});
