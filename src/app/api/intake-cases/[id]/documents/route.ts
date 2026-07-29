import { NextRequest, NextResponse } from "next/server";
import { ingestSourceDocument } from "@/features/briefs/application/stage-1-pipeline";
import { STAGE_1_MAX_PDF_BYTES } from "@/features/briefs/application/validate-stage-1-input";
import { demoStage1Store, listDemoBriefSources } from "@/lib/demoStore";
import { supabaseStage1Store, writeAuditLog } from "@/lib/repository";
import { enforceRateLimit, noStoreJson, rejectCrossOriginMutation, resolveAdminAccess } from "@/lib/security";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = enforceRateLimit(request, "case_documents", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const sources = access.demo ? listDemoBriefSources(id) : await supabaseStage1Store.listSources(id);
  return noStoreJson({ sources });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = enforceRateLimit(request, "case_documents_upload", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  const access = await resolveAdminAccess();
  if (!access.ok) return access.response;
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;

  try {
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Attach a PDF file." }, { status: 400 });
    // Rejected before the body is copied into a buffer and parsed. The request
    // itself has already been read, so this is not a defence against a large
    // upload; a size limit at the edge is still required in a deployment.
    if (file.size > STAGE_1_MAX_PDF_BYTES) return NextResponse.json({ error: "PDF must be between 1 byte and 6 MB." }, { status: 400 });

    const source = await ingestSourceDocument({
      caseId: id,
      fileName: file.name,
      mimeType: file.type || "application/pdf",
      bytes: new Uint8Array(await file.arrayBuffer()),
      store: access.demo ? demoStage1Store : supabaseStage1Store,
    });

    if (!access.demo) {
      await writeAuditLog({
        action: "source_document_attached",
        entityType: "source_document",
        entityId: source.documentId,
        metadata: { caseId: id, fileName: source.fileName, pages: source.pages.length, documentSha256: source.documentSha256 },
      });
    }

    return noStoreJson({ source }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The document could not be attached.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
