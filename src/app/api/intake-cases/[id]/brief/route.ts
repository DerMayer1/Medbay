import { NextRequest, NextResponse } from "next/server";
import { generateBriefVersion } from "@/features/briefs/application/stage-1-pipeline";
import { demoStage1Store } from "@/lib/demoStore";
import { supabaseStage1Store, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, resolveAdminAccess } from "@/lib/security";

/**
 * Generates a new immutable brief version for the case. Staff may generate and
 * regenerate; only a clinician can finalize one, which is enforced separately by
 * the review endpoint.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = enforceRateLimit(request, "brief_generation", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  try {
    const { id } = await params;
    const brief = await generateBriefVersion({
      caseId: id,
      store: access.demo ? demoStage1Store : supabaseStage1Store,
    });

    if (!access.demo) {
      await writeAuditLog({
        action: "brief_version_generated",
        entityType: "brief_version",
        entityId: brief.versionId,
        metadata: { caseId: id, versionNumber: brief.versionNumber, facts: brief.facts.length, contentSha256: brief.contentSha256 },
      });
    }

    return noStoreJson(brief, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The brief version could not be generated.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
