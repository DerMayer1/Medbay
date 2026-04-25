import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/calendar";
import { createAppointmentRecord, listAppointments, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, requireAdmin } from "@/lib/security";
import { appointmentPayloadSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "admin_appointments", { limit: 120, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    return noStoreJson(await listAppointments());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load appointments" }, { status: 400 });
  }
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
      summary: "Northstar Clinic appointment",
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

  try {
    const data = await createAppointmentRecord(record);
    await writeAuditLog({ action: "appointment.created", entityType: "appointment", entityId: String(data.id), metadata: record });
    return noStoreJson(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create appointment" }, { status: 400 });
  }
}
