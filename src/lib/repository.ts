import type { Stage1BriefStore } from "@/features/briefs/application/stage-1-pipeline";
import { assertBriefCanBeApproved, type BriefSource } from "@/features/briefs/domain/pre-consultation-brief";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSupabase } from "@/lib/supabaseServer";
import type { ChatMessage, KnowledgeItem, Lead } from "@/types/lead";

const clinicId = process.env.MEDBAY_CLINIC_ID || "00000000-0000-4000-8000-000000000001";

function requireSupabaseAdmin() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase service role is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return supabase;
}

type SourcePageRow = { page_number: number; page_text: string; text_sha256: string };
type SourceDocumentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  document_sha256: string;
  source_pages?: SourcePageRow[] | null;
};
type BriefReviewDecisionRow = {
  reviewer_id: string;
  decision: string;
  reason: string;
  created_at: string;
  profiles?: { name?: string | null } | null;
};
type BriefVersionRow = {
  id: string;
  case_id: string;
  schema_version: string;
  version_number: number;
  specialty: string;
  consultation_type: string;
  status: string;
  created_at: string;
  generated_by: string;
  content_sha256: string;
  content?: unknown;
  brief_review_decisions?: BriefReviewDecisionRow[] | null;
};

/**
 * Rebuilds the brief exactly as a reviewer sees it: narrative content from the
 * `content` payload, provenance from the stored source documents and pages.
 */
function mapBriefVersionRow(briefVersion: BriefVersionRow | null | undefined, sourceDocuments: SourceDocumentRow[] | null | undefined) {
  if (!briefVersion) return null;
  const review = Array.isArray(briefVersion.brief_review_decisions) ? briefVersion.brief_review_decisions[0] : undefined;
  const content = briefVersion.content && typeof briefVersion.content === "object" ? briefVersion.content as Record<string, unknown> : {};
  return {
    schemaVersion: briefVersion.schema_version,
    versionId: briefVersion.id,
    versionNumber: briefVersion.version_number,
    caseId: briefVersion.case_id,
    specialty: briefVersion.specialty,
    consultationType: briefVersion.consultation_type,
    status: briefVersion.status,
    generatedAt: briefVersion.created_at,
    generatedBy: briefVersion.generated_by,
    contentSha256: briefVersion.content_sha256,
    purpose: content.purpose,
    facts: content.facts,
    sources: (sourceDocuments || []).map((document) => ({
      documentId: document.id,
      fileName: document.file_name,
      mimeType: document.mime_type,
      byteSize: document.byte_size,
      documentSha256: document.document_sha256,
      pages: (document.source_pages || [])
        .slice()
        .sort((left, right) => left.page_number - right.page_number)
        .map((page) => ({ pageNumber: page.page_number, text: page.page_text, textSha256: page.text_sha256 })),
    })),
    review: review ? { reviewerId: review.reviewer_id, reviewerName: review.profiles?.name || "Clinician", decision: review.decision, reason: review.reason, reviewedAt: review.created_at } : undefined,
  };
}

export async function getActiveKnowledge() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("knowledge_items")
    .select("*")
    .eq("active", true)
    .order("category");

  if (error) throw error;
  return (data || []) as KnowledgeItem[];
}

export async function listKnowledge() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("knowledge_items").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createKnowledgeItem(input: Omit<KnowledgeItem, "id">) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("knowledge_items").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgeItem(id: string, input: Partial<KnowledgeItem>) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("knowledge_items").update(input).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function ensureConversation(conversationId: string, visitorId: string, source = "landing_page") {
  const supabase = requireSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.visitor_id !== visitorId) {
      throw new Error("Conversation does not belong to this visitor.");
    }
    return existing;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ id: conversationId, visitor_id: visitorId, source })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata: Record<string, unknown> = {},
) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role, content, metadata })
    .select("*")
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function getRecentMessages(conversationId: string, limit = 12) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse() as ChatMessage[];
}

export async function upsertLeadForConversation(conversationId: string, lead: Partial<Lead>) {
  const supabase = requireSupabaseAdmin();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("lead_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError) throw conversationError;

  const consultationType = lead.consultationType || lead.consultation_type;

  const dbLead = {
    clinic_id: clinicId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    contact: lead.contact,
    reason_for_visit: lead.reasonForVisit || lead.reason_for_visit || lead.goal,
    preferred_service: lead.preferredService || lead.preferred_service || lead.consultation_type,
    urgency_level: lead.urgencyLevel || lead.urgency_level,
    availability: lead.availability || lead.schedulePreference || lead.schedule_preference,
    payment_type: lead.paymentType || lead.payment_type,
    handoff_required: lead.handoffRequired || lead.handoff_required || false,
    consultation_type:
      consultationType === "first_consultation" || consultationType === "return" || consultationType === "unknown"
        ? consultationType
        : undefined,
    goal: lead.goal || lead.reasonForVisit || lead.reason_for_visit,
    modality: lead.modality,
    schedule_preference: lead.schedulePreference || lead.schedule_preference,
    status: lead.status,
    source: lead.source || "landing_page",
    summary: lead.summary,
    updated_at: new Date().toISOString(),
  };

  if (conversation?.lead_id) {
    const { data, error } = await supabase
      .from("leads")
      .update(dbLead)
      .eq("id", conversation.lead_id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("leads").insert(dbLead).select("*").single();
  if (error) throw error;
  const { error: updateError } = await supabase
    .from("conversations")
    .update({ lead_id: data.id, status: data.status })
    .eq("id", conversationId);
  if (updateError) throw updateError;
  return data;
}

export async function getLeadForConversation(conversationId: string) {
  const supabase = requireSupabaseAdmin();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("lead_id, leads(*)")
    .eq("id", conversationId)
    .maybeSingle();
  if (conversationError) throw conversationError;

  if (!conversation?.lead_id) return null;
  const embedded = conversation.leads;
  if (embedded) return embedded as Partial<Lead>;

  const { data, error } = await supabase.from("leads").select("*").eq("id", conversation.lead_id).maybeSingle();
  if (error) throw error;
  return data as Partial<Lead> | null;
}

export async function updateConversationStatus(
  conversationId: string,
  input: { status?: string; last_intent?: string; handoff_required?: boolean; handoff_reason?: string; summary?: string },
) {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase
    .from("conversations")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function listLeads() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("leads").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getLeadBundle(id: string) {
  const supabase = requireSupabaseAdmin();
  const { data: lead, error } = await supabase.from("leads").select("*").eq("clinic_id", clinicId).eq("id", id).single();
  if (error) throw error;

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", id)
    .maybeSingle();
  if (conversationError) throw conversationError;

  const { data: messages, error: messagesError } = conversation
    ? await supabase.from("messages").select("*").eq("conversation_id", conversation.id).order("created_at")
    : { data: [], error: null };
  if (messagesError) throw messagesError;

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .eq("lead_id", id)
    .order("start_time");
  if (appointmentsError) throw appointmentsError;

  const { data: auditEvents, error: auditError } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("clinic_id", clinicId)
    .or(`entity_id.eq.${id},metadata->>caseId.eq.${id}`)
    .order("created_at");
  if (auditError) throw auditError;

  const { data: briefVersion, error: briefError } = await supabase
    .from("brief_versions")
    .select("*, brief_review_decisions(*, profiles!brief_review_decisions_reviewer_id_fkey(name))")
    .eq("clinic_id", clinicId)
    .eq("case_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (briefError) throw briefError;

  const { data: sourceDocuments, error: sourceError } = briefVersion
    ? await supabase.from("source_documents").select("*, source_pages(*)").eq("clinic_id", clinicId).eq("case_id", id)
    : { data: [], error: null };
  if (sourceError) throw sourceError;

  const preConsultationBrief = mapBriefVersionRow(briefVersion, sourceDocuments);

  return { lead: { ...lead, pre_consultation_brief: preConsultationBrief, brief_review_status: briefVersion?.status }, conversation, messages, appointments, auditEvents };
}

export async function updateLeadRecord(id: string, input: Partial<Lead> & { notes?: string }) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("leads")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listConversations() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from("conversations")
    .select("*, leads(*)")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function listAppointments() {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("appointments").select("*, leads(*)").order("start_time", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAppointmentRecord(record: Record<string, unknown>) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from("appointments").insert(record).select("*").single();
  if (error) throw error;
  return data;
}

export async function writeAuditLog(input: {
  actor?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = requireSupabaseAdmin();
  const { error } = await supabase.from("audit_logs").insert({
    clinic_id: clinicId,
    actor: input.actor || "system",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata || {},
  });
  if (error) throw error;
}

type AuthenticatedSupabase = NonNullable<Awaited<ReturnType<typeof getServerSupabase>>>;

async function assertStoredBriefIsApprovable(supabase: AuthenticatedSupabase, caseId: string, versionId: string) {
  const { data: briefVersion, error: briefError } = await supabase
    .from("brief_versions")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("case_id", caseId)
    .eq("id", versionId)
    .maybeSingle();
  if (briefError) throw briefError;
  if (!briefVersion) throw new Error("Brief version not found for this case.");

  const { data: sourceDocuments, error: sourceError } = await supabase
    .from("source_documents")
    .select("*, source_pages(*)")
    .eq("clinic_id", clinicId)
    .eq("case_id", caseId);
  if (sourceError) throw sourceError;

  assertBriefCanBeApproved(mapBriefVersionRow(briefVersion, sourceDocuments));
}

export async function reviewBriefVersion(input: {
  caseId: string;
  versionId: string;
  expectedContentSha256: string;
  decision: "approved" | "rejected";
  reason: string;
}) {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error("Authenticated Supabase client is not configured.");

  // Provenance is re-verified here so an approval can never finalize a version
  // whose citations do not resolve to the pages actually stored for the case.
  // The RPC re-checks the expected content hash inside its transaction, so a
  // version cannot change between this check and the decision.
  if (input.decision === "approved") await assertStoredBriefIsApprovable(supabase, input.caseId, input.versionId);

  const { data, error } = await supabase.rpc("review_brief_version", {
    p_case_id: input.caseId,
    p_version_id: input.versionId,
    p_expected_content_sha256: input.expectedContentSha256,
    p_decision: input.decision,
    p_reason: input.reason,
  });
  if (error) throw error;
  return data;
}

const STAGE_1_BUCKET = "clinical-source-pdfs";

async function requireAuthenticatedActor() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new Error("Authenticated Supabase client is not configured.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("An authenticated session is required.");
  return { supabase, userId: data.user.id };
}

function toBriefSource(document: SourceDocumentRow): BriefSource {
  return {
    documentId: document.id,
    fileName: document.file_name,
    mimeType: "application/pdf",
    byteSize: document.byte_size,
    documentSha256: document.document_sha256,
    pages: (document.source_pages || [])
      .slice()
      .sort((left, right) => left.page_number - right.page_number)
      .map((page) => ({ pageNumber: page.page_number, text: page.page_text, textSha256: page.text_sha256 })),
  };
}

/**
 * Supabase-backed Stage 1 persistence. Source bytes go to the private bucket
 * under a clinic-prefixed path so the storage policies apply, and the brief
 * digest is read back from the database, which derives it on insert.
 */
export const supabaseStage1Store: Stage1BriefStore = {
  async listSources(caseId) {
    const { supabase } = await requireAuthenticatedActor();
    const { data, error } = await supabase
      .from("source_documents")
      .select("*, source_pages(*)")
      .eq("clinic_id", clinicId)
      .eq("case_id", caseId)
      .order("created_at");
    if (error) throw error;
    return (data || []).map(toBriefSource);
  },

  async saveSource(caseId, source, bytes) {
    // The RPC derives the clinic and the creator from the caller's identity.
    const { supabase } = await requireAuthenticatedActor();
    const storagePath = `${clinicId}/${caseId}/${source.documentId}.pdf`;

    const upload = await supabase.storage.from(STAGE_1_BUCKET).upload(storagePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (upload.error) throw upload.error;

    // The document and its pages are written in one transaction: a document row
    // cannot be deleted afterwards, so a partial write is unrecoverable.
    const { error } = await supabase.rpc("attach_source_document", {
      p_case_id: caseId,
      p_document_id: source.documentId,
      p_file_name: source.fileName,
      p_byte_size: source.byteSize,
      p_document_sha256: source.documentSha256,
      p_storage_path: storagePath,
      p_pages: source.pages.map((page) => ({ pageNumber: page.pageNumber, text: page.text, textSha256: page.textSha256 })),
    });

    if (error) {
      // Leave no orphaned object behind when the transaction is rejected.
      await supabase.storage.from(STAGE_1_BUCKET).remove([storagePath]);
      throw error;
    }
  },

  async nextVersionNumber(caseId) {
    const { supabase } = await requireAuthenticatedActor();
    const { data, error } = await supabase
      .from("brief_versions")
      .select("version_number")
      .eq("clinic_id", clinicId)
      .eq("case_id", caseId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data?.version_number ?? 0) + 1;
  },

  async saveBriefVersion(caseId, brief) {
    const { supabase, userId } = await requireAuthenticatedActor();
    const { data, error } = await supabase
      .from("brief_versions")
      .insert({
        id: brief.versionId,
        clinic_id: clinicId,
        case_id: caseId,
        version_number: brief.versionNumber,
        schema_version: brief.schemaVersion,
        specialty: brief.specialty,
        consultation_type: brief.consultationType,
        status: "needs_review",
        content: { purpose: brief.purpose, facts: brief.facts },
        generated_by: brief.generatedBy,
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) throw error;

    // The database derives content_sha256, so the reviewer submits the digest
    // the database will compare against.
    return { ...brief, generatedAt: data.created_at, contentSha256: data.content_sha256 };
  },
};
