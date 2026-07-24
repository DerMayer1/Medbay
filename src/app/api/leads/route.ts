import { listDemoLeads } from "@/lib/demoStore";
import { listLeads } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, resolveAdminAccess } from "@/lib/security";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, "admin_leads", { limit: 120, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;
  return noStoreJson(access.demo ? listDemoLeads() : await listLeads());
}
