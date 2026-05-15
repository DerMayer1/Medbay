import { z } from "zod";
import { evaluateIntakeCompleteness } from "@/features/intake/domain/intake-completeness";
import { decideNextIntakeStatus, validateIntakeTransition } from "@/features/intake/domain/intake-workflow";
import {
  evaluateIntakePolicy,
  validateAssistantOutputSafety,
  type PolicyEvaluation,
} from "@/features/intake/domain/policy-engine";
import type { IntakeCase, IntakeFields, IntakeCaseStatus } from "@/features/intake/domain/types";
import type { IntakeUseCaseDependencies } from "@/features/intake/application/ports";
import {
  buildAiInput,
  buildKnowledgeContextFromItems,
  mapExtractedLeadToIntakeFields,
  mergeIntakeFields,
} from "@/features/intake/infrastructure/adapters";
import { leadToIntakeFields } from "@/features/intake/infrastructure/legacy-mappers";

const handlePatientMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  visitorId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
  metadata: z
    .object({
      source: z.string().optional(),
      page: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type HandlePatientMessageInput = z.input<typeof handlePatientMessageSchema>;

export type HandlePatientMessageResult = {
  reply: string;
  conversationId: string;
  intakeCaseId: string;
  caseStatus: IntakeCaseStatus;
  extractedFields: IntakeFields;
  policy: PolicyEvaluation;
  handoffRequired: boolean;
  handoffReason?: string;
};

function wantsScheduling(message: string) {
  return /\b(schedule|appointment|book|availability|available|slot)\b/i.test(message);
}

function createOpenedCase(input: {
  conversationId: string;
  patientId: string;
  source?: string;
}): IntakeCase {
  return {
    id: crypto.randomUUID(),
    patientId: input.patientId,
    conversationId: input.conversationId,
    status: "opened",
    fields: {},
    handoffRequired: false,
    source: input.source === "manual" ? input.source : "landing_page",
    createdAt: new Date().toISOString(),
  };
}

function mergeAiExtractedFields(fields: IntakeFields, extractedData: unknown): IntakeFields {
  if (!extractedData || typeof extractedData !== "object") return fields;
  return mergeIntakeFields(fields, leadToIntakeFields(extractedData as Parameters<typeof leadToIntakeFields>[0]));
}

function safeReplyFromPolicy(policy: PolicyEvaluation) {
  return policy.safeResponseHint;
}

function hasMeaningfulExtraction(fields: IntakeFields) {
  return Object.values(fields).some((value) => value !== undefined && value !== "" && value !== "unknown");
}

function fallbackAdministrativeReply(policy: PolicyEvaluation, fields: IntakeFields) {
  if (policy.decision === "ask_clarifying_question" || policy.decision === "block" || policy.decision === "escalate") {
    return policy.safeResponseHint;
  }

  if (!fields.patientName) return "I can start the intake. What is the patient's full name?";
  if (!fields.contact) return "What is the best phone number or email for clinic follow-up?";
  if (!fields.reasonForVisit) return "What is the main reason for the visit?";
  if (!fields.requestedService) return "Which clinic service or specialty should this be routed to?";
  if (!fields.urgencyLevel) return "How urgent is this request: low, medium, high, or urgent?";
  if (!fields.availability) return "What days or times usually work for an appointment?";
  if (!fields.paymentType) return "Will this be insurance or self-pay?";
  return "I have the core intake details and can route this to the clinic team for review.";
}

export async function handlePatientMessage(
  rawInput: HandlePatientMessageInput,
  dependencies: IntakeUseCaseDependencies,
): Promise<HandlePatientMessageResult> {
  const input = handlePatientMessageSchema.parse(rawInput);
  const conversationId = input.conversationId || crypto.randomUUID();
  const source = input.metadata?.source || "landing_page";

  await dependencies.conversationRepository.loadOrCreateConversation({
    conversationId,
    visitorId: input.visitorId,
    source,
  });

  let intakeCase = await dependencies.caseRepository.findByConversationId(conversationId);
  if (!intakeCase) {
    const patient = await dependencies.patientRepository.loadOrCreatePatient({ visitorId: input.visitorId });
    intakeCase = await dependencies.caseRepository.save(
      createOpenedCase({ conversationId, patientId: patient.id, source }),
    );
    await dependencies.auditLogger.record({
      action: "case_created",
      entityType: "intake_case",
      entityId: intakeCase.id,
      metadata: { conversationId, source },
    });
  }

  await dependencies.conversationRepository.saveMessage({
    conversationId,
    role: "user",
    content: input.message,
    metadata: input.metadata || {},
  });
  await dependencies.auditLogger.record({
    action: "message_received",
    entityType: "intake_case",
    entityId: intakeCase.id,
    metadata: { conversationId },
  });

  const deterministicFields = mapExtractedLeadToIntakeFields(input.message, intakeCase.fields);
  let mergedFields = mergeIntakeFields(intakeCase.fields, deterministicFields);
  const policy = evaluateIntakePolicy({
    message: input.message,
    extractedFields: mergedFields,
    extractionConfidence: hasMeaningfulExtraction(deterministicFields) ? 0.8 : undefined,
    wantsScheduling: wantsScheduling(input.message),
  });

  await dependencies.auditLogger.record({
    action: "policy_evaluated",
    entityType: "intake_case",
    entityId: intakeCase.id,
    metadata: { decision: policy.decision, severity: policy.severity, flags: policy.flags },
  });

  const knowledgeItems = await dependencies.knowledgeBaseRepository.listActive();
  const recentMessages = await dependencies.conversationRepository.getRecentMessages(conversationId);
  let reply = safeReplyFromPolicy(policy);
  let summary = intakeCase.summary || input.message;

  if (policy.decision === "allow" || policy.decision === "ask_clarifying_question") {
    try {
      const aiOutput = await dependencies.aiProvider.generateResponse(
        buildAiInput({
          message: input.message,
          messages: recentMessages,
          knowledge: buildKnowledgeContextFromItems(knowledgeItems),
          fields: mergedFields,
        }),
      );
      mergedFields = mergeAiExtractedFields(mergedFields, aiOutput.extractedData);
      reply = policy.decision === "ask_clarifying_question" ? policy.safeResponseHint : aiOutput.reply;
      summary = aiOutput.summary || summary;

      const outputPolicy = validateAssistantOutputSafety(reply);
      if (outputPolicy.decision === "block" || outputPolicy.decision === "escalate") {
        reply = outputPolicy.safeResponseHint;
      }
    } catch (error) {
      console.error("ai_provider_error", error);
      reply = fallbackAdministrativeReply(policy, mergedFields);
    }
  }

  const completeness = evaluateIntakeCompleteness(mergedFields);
  const nextStatus = decideNextIntakeStatus({
    currentStatus: intakeCase.status,
    policy,
    completeness,
    appointmentRequested: wantsScheduling(input.message),
  });
  const transition = validateIntakeTransition(intakeCase.status, nextStatus);
  const status = transition.valid ? nextStatus : intakeCase.status;

  const updatedCase = await dependencies.caseRepository.save({
    ...intakeCase,
    status,
    fields: mergedFields,
    handoffRequired: policy.handoffRequired,
    handoffReason: policy.handoffRequired ? policy.reason : intakeCase.handoffReason,
    summary,
    triage: {
      urgencyLevel: mergedFields.urgencyLevel,
      riskFlags: policy.flags,
      confidence: completeness.score / 100,
      requiresHumanReview: policy.handoffRequired,
    },
    updatedAt: new Date().toISOString(),
  });

  await dependencies.auditLogger.record({
    action: "intake_extracted",
    entityType: "intake_case",
    entityId: updatedCase.id,
    metadata: { extractedFields: deterministicFields, completeness },
  });

  if (intakeCase.status !== status) {
    await dependencies.auditLogger.record({
      action: "status_changed",
      entityType: "intake_case",
      entityId: updatedCase.id,
      metadata: { from: intakeCase.status, to: status },
    });
  }

  await dependencies.conversationRepository.updateStatus(conversationId, {
    status,
    handoffReason: updatedCase.handoffReason,
    summary,
  });

  await dependencies.conversationRepository.saveMessage({
    conversationId,
    role: "assistant",
    content: reply,
    metadata: {
      caseStatus: status,
      policyDecision: policy.decision,
      handoffRequired: policy.handoffRequired,
    },
  });
  await dependencies.auditLogger.record({
    action: "assistant_message_sent",
    entityType: "intake_case",
    entityId: updatedCase.id,
    metadata: { conversationId },
  });

  if (policy.handoffRequired) {
    await dependencies.auditLogger.record({
      action: "handoff_requested",
      entityType: "intake_case",
      entityId: updatedCase.id,
      metadata: { reason: policy.reason, severity: policy.severity },
    });
  }

  if (policy.handoffRequired || status === "ready_for_scheduling") {
    try {
      await dependencies.notificationProvider.notifyIntakeEvent({
        subject: policy.handoffRequired ? "Human review requested - Medbay" : "Intake case ready for scheduling - Medbay",
        intakeCase: updatedCase,
        summary,
      });
      await dependencies.auditLogger.record({
        action: "notification_sent",
        entityType: "intake_case",
        entityId: updatedCase.id,
        metadata: { handoffRequired: policy.handoffRequired },
      });
    } catch (error) {
      console.error("notification_provider_error", error);
    }
  }

  if (status === "appointment_requested") {
    await dependencies.auditLogger.record({
      action: "appointment_requested",
      entityType: "intake_case",
      entityId: updatedCase.id,
      metadata: { availability: mergedFields.availability },
    });
  }

  return {
    reply,
    conversationId,
    intakeCaseId: updatedCase.id,
    caseStatus: status,
    extractedFields: mergedFields,
    policy,
    handoffRequired: policy.handoffRequired,
    handoffReason: updatedCase.handoffReason,
  };
}
