import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getLeadBundle, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, requireAdmin } from "@/lib/security";
import { leadPatchSchema } from "@/lib/validators";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = enforceRateLimit(_request, "admin_leads", { limit: 120, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  return noStoreJson(await getLeadBundle(id));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = enforceRateLimit(request, "admin_leads_mutation", { limit: 30, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const authError = await requireAdmin();
  if (authError) return authError;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const { id } = await params;
  const input = leadPatchSchema.parse(await request.json());
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    await writeAuditLog({ action: "lead.updated", entityType: "lead", entityId: id, metadata: input });
    return noStoreJson({ id, ...input });
  }

  const { data, error } = await supabase
    .from("leads")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await writeAuditLog({ action: "lead.updated", entityType: "lead", entityId: id, metadata: input });
  return noStoreJson(data);
}
