import { z } from "zod";

export const chatPayloadSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
  metadata: z
    .object({
      source: z.enum(["landing_page", "manual"]).optional(),
      page: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const leadPatchSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  contact: z.string().optional(),
  reason_for_visit: z.string().optional(),
  preferred_service: z.string().optional(),
  urgency_level: z.enum(["low", "medium", "high", "urgent", "unknown"]).optional(),
  availability: z.string().optional(),
  payment_type: z.enum(["insurance", "self_pay", "unknown"]).optional(),
  handoff_required: z.boolean().optional(),
  status: z
    .enum([
      "opened",
      "collecting_information",
      "needs_human_review",
      "ready_for_scheduling",
      "appointment_requested",
      "scheduled",
      "closed",
      "discarded",
      "new",
      "qualified",
      "waiting_human",
      "lost",
      "resolved",
    ])
    .optional(),
  notes: z.string().optional(),
});

export const knowledgePayloadSchema = z.object({
  category: z.enum(["services", "pricing", "schedule", "policies", "faq", "safety"]),
  title: z.string().min(1),
  content: z.string().min(1),
  active: z.boolean().default(true),
});

export const handoffPayloadSchema = z.object({
  conversationId: z.string().uuid(),
  reason: z.string().min(1),
});

export const appointmentPayloadSchema = z.object({
  leadId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  modality: z.string().optional(),
  status: z.enum(["requested", "under_review", "slot_offered", "confirmed", "cancelled", "completed"]).optional(),
  notes: z.string().optional(),
  createGoogleEvent: z.boolean().optional(),
});
