import { listLeads } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, requireAdmin } from "@/lib/security";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "admin_leads", { limit: 120, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const authError = await requireAdmin();
  if (authError) return authError;
  return noStoreJson(await listLeads());
}
