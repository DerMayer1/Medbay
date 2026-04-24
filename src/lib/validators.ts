import { z } from "zod";

export const chatPayloadSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
  metadata: z
    .object({
      source: z.string().optional(),
      page: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const leadPatchSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  consultation_type: z.enum(["first_consultation", "return", "unknown"]).optional(),
  goal: z.string().optional(),
  modality: z.enum(["online", "in_person", "unknown"]).optional(),
  schedule_preference: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

export const knowledgePayloadSchema = z.object({
  category: z.enum([
    "prices",
    "location",
    "hours",
    "online_consultation",
    "in_person_consultation",
    "first_consultation",
    "return_consultation",
    "payment",
    "cancellation",
    "exams",
    "general",
  ]),
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
  notes: z.string().optional(),
  createGoogleEvent: z.boolean().optional(),
});
