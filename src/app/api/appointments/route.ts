import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/calendar";
import { writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, requireAdmin } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { appointmentPayloadSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "admin_appointments", { limit: 120, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabaseAdmin();
  if (!supabase) return noStoreJson([]);
  const { data, error } = await supabase.from("appointments").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return noStoreJson(data);
}

export async function POST(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "admin_appointments_mutation", { limit: 20, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const authError = await requireAdmin();
  if (authError) return authError;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const payload = appointmentPayloadSchema.parse(await request.json());
  let googleEventId: string | undefined;

  if (payload.createGoogleEvent && payload.startTime && payload.endTime) {
    const created = await createCalendarEvent({
      summary: "Consulta nutricional — Juliana Pansardi",
      description: payload.notes,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
    googleEventId = created.googleEventId;
  }

  const record = {
    lead_id: payload.leadId,
    conversation_id: payload.conversationId,
    start_time: payload.startTime,
    end_time: payload.endTime,
    modality: payload.modality,
    status: payload.createGoogleEvent ? "pending_confirmation" : "pending_confirmation",
    google_event_id: googleEventId,
    notes: payload.notes,
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const id = crypto.randomUUID();
    await writeAuditLog({ action: "appointment.created", entityType: "appointment", entityId: id, metadata: record });
    return noStoreJson({ id, ...record });
  }

  const { data, error } = await supabase.from("appointments").insert(record).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await writeAuditLog({ action: "appointment.created", entityType: "appointment", entityId: data.id, metadata: record });
  return noStoreJson(data);
}
