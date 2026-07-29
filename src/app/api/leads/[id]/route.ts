import { NextRequest, NextResponse } from "next/server";
import { getDemoLeadBundle, updateDemoLeadRecord } from "@/lib/demoStore";
import { getLeadBundle, updateLeadRecord, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, resolveAdminAccess } from "@/lib/security";
import { leadPatchSchema } from "@/lib/validators";
import { validateIntakeTransition } from "@/features/intake/domain/intake-workflow";
import { legacyStatusToIntakeStatus } from "@/features/intake/infrastructure/legacy-mappers";
import type { Lead } from "@/types/lead";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = enforceRateLimit(_request, "admin_leads", { limit: 120, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  if (access.demo) return noStoreJson(getDemoLeadBundle(id));

  return noStoreJson(await getLeadBundle(id));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = enforceRateLimit(request, "admin_leads_mutation", { limit: 30, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  const { id } = await params;
  const input = leadPatchSchema.parse(await request.json());
  const isDemo = access.demo;
  if (input.status) {
    const bundle = isDemo ? getDemoLeadBundle(id) : await getLeadBundle(id);
    const currentStatus = legacyStatusToIntakeStatus(String(bundle.lead?.status || "new"));
    const nextStatus = legacyStatusToIntakeStatus(input.status);
    const transition = validateIntakeTransition(currentStatus, nextStatus);
    if (!transition.valid) return NextResponse.json({ error: transition.reason }, { status: 400 });
  }

  try {
    const patch: Partial<Lead> & { notes?: string } = { ...input };

    if (isDemo) return noStoreJson(updateDemoLeadRecord(id, patch));

    const data = await updateLeadRecord(id, patch);
    const action = input.status ? "status_changed" : "intake_case_updated";
    const auditMetadata: Record<string, unknown> = input.status
      ? { to: input.status }
      : { fieldsUpdated: Object.keys(input) };
    await writeAuditLog({ action, entityType: "intake_case", entityId: id, metadata: auditMetadata });
    return noStoreJson(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update intake case" }, { status: 400 });
  }
}
