import { NextRequest, NextResponse } from "next/server";
import { getLeadBundle, updateLeadRecord, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, requireAdmin } from "@/lib/security";
import { leadPatchSchema } from "@/lib/validators";
import { validateIntakeTransition } from "@/features/intake/domain/intake-workflow";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";

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
  if (input.status) {
    const bundle = await getLeadBundle(id);
    const currentStatus = legacyStatusToIntakeStatus(String(bundle.lead?.status || "new"));
    const nextStatus = legacyStatusToIntakeStatus(input.status);
    const transition = validateIntakeTransition(currentStatus, nextStatus);
    if (!transition.valid) return NextResponse.json({ error: transition.reason }, { status: 400 });
  }

  try {
    const data = await updateLeadRecord(id, input);
    await writeAuditLog({ action: "status_changed", entityType: "intake_case", entityId: id, metadata: input });
    return noStoreJson(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update intake case" }, { status: 400 });
  }
}
