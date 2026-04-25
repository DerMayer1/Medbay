import type { IntakeCompleteness } from "@/features/intake/domain/intake-completeness";
import type { PolicyEvaluation } from "@/features/intake/domain/policy-engine";
import type { IntakeCaseStatus } from "@/features/intake/domain/types";

export const intakeCaseStatuses: IntakeCaseStatus[] = [
  "opened",
  "collecting_information",
  "needs_human_review",
  "ready_for_scheduling",
  "appointment_requested",
  "scheduled",
  "closed",
  "discarded",
];

export const allowedTransitions: Record<IntakeCaseStatus, IntakeCaseStatus[]> = {
  opened: ["collecting_information", "needs_human_review", "ready_for_scheduling", "discarded"],
  collecting_information: ["needs_human_review", "ready_for_scheduling", "discarded"],
  needs_human_review: ["collecting_information", "ready_for_scheduling", "closed", "discarded"],
  ready_for_scheduling: ["appointment_requested", "needs_human_review", "closed", "discarded"],
  appointment_requested: ["scheduled", "needs_human_review", "closed", "discarded"],
  scheduled: ["closed", "needs_human_review"],
  closed: [],
  discarded: [],
};

export type StatusTransition = {
  from: IntakeCaseStatus;
  to: IntakeCaseStatus;
  valid: boolean;
  reason?: string;
};

export function canTransitionIntakeCase(from: IntakeCaseStatus, to: IntakeCaseStatus) {
  return from === to || allowedTransitions[from].includes(to);
}

export function validateIntakeTransition(from: IntakeCaseStatus, to: IntakeCaseStatus): StatusTransition {
  if (canTransitionIntakeCase(from, to)) return { from, to, valid: true };

  return {
    from,
    to,
    valid: false,
    reason: `Cannot transition intake case from ${from} to ${to}.`,
  };
}

export function assertValidIntakeTransition(from: IntakeCaseStatus, to: IntakeCaseStatus) {
  const transition = validateIntakeTransition(from, to);
  if (!transition.valid) throw new Error(transition.reason);
  return transition;
}

export function getAllowedNextStatuses(status: IntakeCaseStatus) {
  return allowedTransitions[status];
}

export function decideNextIntakeStatus(input: {
  currentStatus: IntakeCaseStatus;
  policy: PolicyEvaluation;
  completeness: IntakeCompleteness;
  appointmentRequested?: boolean;
}): IntakeCaseStatus {
  const { currentStatus, policy, completeness, appointmentRequested } = input;

  if (currentStatus === "closed" || currentStatus === "discarded" || currentStatus === "scheduled") return currentStatus;
  if (policy.handoffRequired || policy.decision === "block" || policy.severity === "critical") return "needs_human_review";
  if (appointmentRequested && completeness.readyForScheduling) return "appointment_requested";
  if (completeness.readyForScheduling) return "ready_for_scheduling";
  return currentStatus === "opened" ? "collecting_information" : currentStatus;
}
