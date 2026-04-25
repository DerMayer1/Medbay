import type { AppointmentStatus } from "@/features/intake/domain/types";

export const appointmentStatuses: AppointmentStatus[] = [
  "requested",
  "under_review",
  "slot_offered",
  "confirmed",
  "cancelled",
  "completed",
];

export const allowedAppointmentTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  requested: ["under_review", "cancelled"],
  under_review: ["slot_offered", "cancelled"],
  slot_offered: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus) {
  return from === to || allowedAppointmentTransitions[from].includes(to);
}
