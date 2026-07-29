import { NextRequest, NextResponse } from "next/server";
import { reviewDemoBriefVersion } from "@/lib/demoStore";
import { briefReviewSchema } from "@/lib/validators";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, resolveClinicalReviewAccess } from "@/lib/security";
import { reviewBriefVersion } from "@/lib/repository";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = enforceRateLimit(request, "brief_review", { limit: 20, windowMs: 60_000 });
  if (limited) return limited;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const access = await resolveClinicalReviewAccess();
  if (!access.ok) return access.response;

  try {
    const { id: versionId } = await params;
    const input = briefReviewSchema.parse(await request.json());
    const reviewed = access.demo
      ? reviewDemoBriefVersion({ ...input, versionId, reviewer: access.reviewer })
      : await reviewBriefVersion({ ...input, versionId });
    return noStoreJson(reviewed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The brief review could not be saved.";
    const conflict = /changed|already|final/i.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}
