import type { Lead, PaymentType, UrgencyLevel } from "@/types/lead";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phonePattern = /(?:\+?1\s?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/;

function detectUrgency(text: string): UrgencyLevel | undefined {
  if (/\b(emergency|urgent|today|asap|severe)\b/i.test(text)) return "urgent";
  if (/\b(high|soon|this week)\b/i.test(text)) return "high";
  if (/\b(medium|next week)\b/i.test(text)) return "medium";
  if (/\b(low|routine|not urgent)\b/i.test(text)) return "low";
  return undefined;
}

function detectPayment(text: string): PaymentType | undefined {
  if (/\binsurance|insured|coverage\b/i.test(text)) return "insurance";
  if (/\bself[-\s]?pay|cash|card|private pay\b/i.test(text)) return "self_pay";
  return undefined;
}

export function extractLeadHints(message: string): Partial<Lead> {
  const email = message.match(emailPattern)?.[0];
  const phone = message.match(phonePattern)?.[0];
  const clean = message.trim();
  const extracted: Partial<Lead> = {};

  if (email) {
    extracted.email = email;
    extracted.contact = email;
  }
  if (phone) {
    extracted.phone = phone;
    extracted.contact = phone;
  }
  const urgency = detectUrgency(clean);
  if (urgency) extracted.urgencyLevel = urgency;
  const payment = detectPayment(clean);
  if (payment) extracted.paymentType = payment;
  if (/my name is\s+/i.test(clean)) extracted.name = clean.replace(/.*my name is\s+/i, "").trim().slice(0, 120);
  if (/dermatology|cardiology|primary care|orthopedics|mental health|pediatrics/i.test(clean)) {
    extracted.preferredService = clean.match(/dermatology|cardiology|primary care|orthopedics|mental health|pediatrics/i)?.[0];
  }

  return extracted;
}

export function extractLeadByState(message: string, state: string): Partial<Lead> {
  const extracted = extractLeadHints(message);
  const clean = message.trim().slice(0, 300);

  if (state === "collecting_name" && !extracted.name) extracted.name = clean;
  if (state === "collecting_contact" && !extracted.contact) extracted.contact = clean;
  if (state === "collecting_reason" && !extracted.reasonForVisit) extracted.reasonForVisit = clean;
  if (state === "collecting_service" && !extracted.preferredService) extracted.preferredService = clean;
  if (state === "collecting_urgency" && !extracted.urgencyLevel) extracted.urgencyLevel = detectUrgency(clean) || "unknown";
  if (state === "collecting_availability" && !extracted.availability) extracted.availability = clean;
  if (state === "collecting_payment" && !extracted.paymentType) extracted.paymentType = detectPayment(clean) || "unknown";

  return extracted;
}
