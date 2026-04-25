import type { IntakeFields } from "@/features/intake/domain/types";

export type RequiredIntakeField =
  | "patientName"
  | "contact"
  | "reasonForVisit"
  | "requestedService"
  | "urgencyLevel"
  | "paymentType"
  | "availability";

export type IntakeCompleteness = {
  score: number;
  missingFields: RequiredIntakeField[];
  readyForScheduling: boolean;
};

const requiredFields: RequiredIntakeField[] = [
  "patientName",
  "contact",
  "reasonForVisit",
  "requestedService",
  "urgencyLevel",
  "paymentType",
  "availability",
];

function hasField(fields: IntakeFields, field: RequiredIntakeField) {
  const value = fields[field];
  return Boolean(value && value !== "unknown");
}

export function evaluateIntakeCompleteness(fields: IntakeFields): IntakeCompleteness {
  const missingFields = requiredFields.filter((field) => !hasField(fields, field));
  const completed = requiredFields.length - missingFields.length;
  const score = Math.round((completed / requiredFields.length) * 100);

  return {
    score,
    missingFields,
    readyForScheduling: missingFields.length === 0,
  };
}
