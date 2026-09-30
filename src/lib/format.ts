const labelOverrides: Record<string, string> = {
  in_person: "In person",
  needs_human_review: "Needs human review",
  ready_for_scheduling: "Ready for scheduling",
  appointment_requested: "Appointment requested",
  collecting_information: "Collecting information",
  needs_review: "Needs review",
  primary_care: "Primary care",
};

/** Turns stored enum values such as `ready_for_scheduling` into UI labels. */
export function humanize(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  const raw = String(value);
  if (labelOverrides[raw]) return labelOverrides[raw];
  const spaced = raw.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

/** Formats ISO timestamps for display; leaves non-date strings untouched. */
export function formatDateTime(value: unknown, fallback = "Not scheduled") {
  if (value === null || value === undefined || value === "") return fallback;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return dateTimeFormat.format(date);
}

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneByValue: Record<string, StatusTone> = {
  opened: "neutral",
  collecting_information: "neutral",
  draft: "neutral",
  requested: "info",
  appointment_requested: "info",
  needs_review: "warning",
  needs_human_review: "warning",
  medium: "warning",
  high: "danger",
  urgent: "danger",
  emergency: "danger",
  block: "danger",
  rejected: "danger",
  discarded: "danger",
  low: "neutral",
  ready_for_scheduling: "success",
  scheduled: "success",
  confirmed: "success",
  approved: "success",
  allow: "success",
  closed: "neutral",
};

export function toneFor(value: unknown): StatusTone {
  return toneByValue[String(value ?? "")] ?? "info";
}
