import { NextRequest } from "next/server";
import { getAvailableSlots } from "@/lib/calendar";
import { enforceRateLimit, noStoreJson } from "@/lib/security";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "calendar_availability", { limit: 30, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;

  const { searchParams } = new URL(request.url);
  const slots = await getAvailableSlots(searchParams.get("start") || undefined, searchParams.get("end") || undefined);
  return noStoreJson({ slots });
}
