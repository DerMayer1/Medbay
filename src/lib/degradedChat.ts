import { evaluateIntakePolicy } from "@/features/intake/domain/policy-engine";

const intakePrompts = [
  "What is the patient's full name?",
  "What is the best phone number or email for follow-up?",
  "What is the main reason for the visit?",
  "Which clinic service or specialty is needed?",
  "How urgent is this request: low, medium, high, or urgent?",
  "What days or times usually work for an appointment?",
  "Will this be insurance or self-pay?",
] as const;

const nonAnswers = [
  /^(hi|hello|hey|start|start intake|start a new patient intake)[.!]?$/i,
  /^what services/i,
  /^i need to schedule/i,
];

function isIntakeAnswer(message: string) {
  return !nonAnswers.some((pattern) => pattern.test(message.trim()));
}

export function createDegradedChatReply(message: string, history: string[] = []) {
  const policy = evaluateIntakePolicy({
    message,
    wantsScheduling: /\b(schedule|appointment|book|availability|slot)\b/i.test(message),
  });

  if (policy.decision === "block" || policy.decision === "escalate") {
    return {
      reply: `${policy.safeResponseHint} The clinic system is temporarily unavailable, so this request has not been submitted yet.`,
      handoffRequired: policy.handoffRequired,
      policy,
    };
  }

  if (/\b(services|specialties|offer)\b/i.test(message)) {
    return {
      reply:
        "Northstar Clinic supports primary care, dermatology, orthopedics, cardiology, pediatrics, and behavioral health intake. The clinic system is temporarily unavailable, so details entered now remain in this browser session.",
      handoffRequired: false,
      policy,
    };
  }

  const answers = [...history, message].filter(isIntakeAnswer);
  const nextPrompt = intakePrompts[Math.min(answers.length, intakePrompts.length - 1)];
  const complete = answers.length >= intakePrompts.length;

  return {
    reply: complete
      ? "The intake details are complete in this session, but they have not been submitted because the clinic system is temporarily unavailable. Please try again later or contact the clinic directly."
      : nextPrompt,
    handoffRequired: false,
    policy,
  };
}
