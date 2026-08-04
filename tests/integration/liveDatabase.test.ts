import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Live database gates: immutability, atomicity, clinic isolation, the
 * clinician-only review RPC, and the private storage bucket. These cannot be
 * proven in memory, so they run only against a real Supabase project.
 *
 *   SUPABASE_TEST_URL=https://<ref>.supabase.co \
 *   SUPABASE_TEST_SERVICE_ROLE_KEY=... \
 *   SUPABASE_TEST_ANON_KEY=... \
 *   npx vitest run tests/integration/liveDatabase.test.ts
 *
 * Point this at a project you can afford to pollute. Every run creates auth
 * users, a case, source documents and brief versions, and the immutability
 * triggers mean that data cannot be deleted afterwards by design.
 */
const url = process.env.SUPABASE_TEST_URL;
const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const live = Boolean(url && serviceRoleKey && anonKey);

const clinicId = "00000000-0000-4000-8000-000000000001";
const otherClinicId = "00000000-0000-4000-8000-000000000002";
const password = "stage-1-synthetic-password";
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

let admin: SupabaseClient;
let caseId: string;
let documentId: string;
let versionId: string;
let clinicianClient: SupabaseClient;
let staffClient: SupabaseClient;
let outsiderClient: SupabaseClient;

async function createUser(email: string, name: string, role: string, clinic: string) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const { error: profileError } = await admin.from("profiles").upsert({ id: data.user.id, name, role, clinic_id: clinic });
  if (profileError) throw profileError;

  const client = createClient(url!, anonKey!);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

async function insertBriefVersion(versionNumber: number, content: Record<string, unknown>, createdBy: string) {
  const { data, error } = await admin
    .from("brief_versions")
    .insert({
      clinic_id: clinicId,
      case_id: caseId,
      version_number: versionNumber,
      schema_version: "2.0.1",
      specialty: "cardiology",
      consultation_type: "first_consultation",
      content,
      generated_by: "synthetic_stage_1",
      created_by: createdBy,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

describe.skipIf(!live)("Stage 1 live database gates", () => {
  let clinicianId: string;

  beforeAll(async () => {
    admin = createClient(url!, serviceRoleKey!, { auth: { persistSession: false } });

    await admin.from("clinics").upsert([
      { id: clinicId, name: "Northstar Clinic" },
      { id: otherClinicId, name: "Southpoint Clinic" },
    ]);

    const stamp = Date.now();
    const clinician = await createUser(`clinician-${stamp}@northstar.test`, "Dr. Reyes", "clinician", clinicId);
    const staff = await createUser(`staff-${stamp}@northstar.test`, "Ops Staff", "staff", clinicId);
    const outsider = await createUser(`clinician-${stamp}@southpoint.test`, "Dr. Vale", "clinician", otherClinicId);
    clinicianId = clinician.id;
    clinicianClient = clinician.client;
    staffClient = staff.client;
    outsiderClient = outsider.client;

    const { data: lead, error: leadError } = await admin
      .from("leads")
      .insert({ clinic_id: clinicId, name: "Maya Chen", status: "opened" })
      .select("id")
      .single();
    if (leadError) throw leadError;
    caseId = lead.id;

    const { data: document, error: documentError } = await admin
      .from("source_documents")
      .insert({
        clinic_id: clinicId, case_id: caseId, file_name: "referral.pdf", mime_type: "application/pdf",
        byte_size: 1842, document_sha256: sha256("referral"), storage_path: `${clinicId}/${caseId}/${randomUUID()}.pdf`,
        created_by: clinicianId,
      })
      .select("id")
      .single();
    if (documentError) throw documentError;
    documentId = document.id;

    const { error: pageError } = await admin.from("source_pages").insert({
      clinic_id: clinicId, document_id: documentId, page_number: 1,
      page_text: "Recurring palpitations; cardiology follow-up requested.", text_sha256: sha256("page-1"),
    });
    if (pageError) throw pageError;
  });

  it("derives the content digest on insert", async () => {
    const content = { purpose: "Source-linked context.", facts: [] };
    const version = await insertBriefVersion(1, content, clinicianId);
    versionId = version.id;

    expect(version.content_sha256).toMatch(/^[a-f0-9]{64}$/);
    // Re-inserting identical content under a new version yields the same digest.
    const duplicate = await insertBriefVersion(2, content, clinicianId);
    expect(duplicate.content_sha256).toBe(version.content_sha256);
    await admin.from("brief_versions").update({ status: "rejected" }).eq("id", duplicate.id);
  });

  it("refuses to edit or delete frozen clinical records", async () => {
    const edited = await admin.from("brief_versions").update({ content: { purpose: "Rewritten.", facts: [] } }).eq("id", versionId);
    expect(edited.error?.message).toMatch(/immutable/i);

    const removed = await admin.from("brief_versions").delete().eq("id", versionId);
    expect(removed.error?.message).toMatch(/immutable/i);

    const editedPage = await admin.from("source_pages").update({ page_text: "Rewritten page." }).eq("document_id", documentId);
    expect(editedPage.error?.message).toMatch(/immutable/i);

    const removedDocument = await admin.from("source_documents").delete().eq("id", documentId);
    expect(removedDocument.error?.message).toMatch(/immutable/i);
  });

  it("caps a case at five source documents", async () => {
    for (let index = 1; index < 5; index += 1) {
      const { error } = await admin.from("source_documents").insert({
        clinic_id: clinicId, case_id: caseId, file_name: `extra-${index}.pdf`, mime_type: "application/pdf",
        byte_size: 1000 + index, document_sha256: sha256(`extra-${index}`),
        storage_path: `${clinicId}/${caseId}/${randomUUID()}.pdf`, created_by: clinicianId,
      });
      expect(error).toBeNull();
    }

    const { error } = await admin.from("source_documents").insert({
      clinic_id: clinicId, case_id: caseId, file_name: "sixth.pdf", mime_type: "application/pdf",
      byte_size: 2000, document_sha256: sha256("sixth"),
      storage_path: `${clinicId}/${caseId}/${randomUUID()}.pdf`, created_by: clinicianId,
    });
    expect(error?.message).toMatch(/at most five source documents/i);
  });

  it("rejects a final decision from a non-clinician", async () => {
    const { data: version } = await admin.from("brief_versions").select("content_sha256").eq("id", versionId).single();
    const { error } = await staffClient.rpc("review_brief_version", {
      p_case_id: caseId, p_version_id: versionId,
      p_expected_content_sha256: version!.content_sha256,
      p_decision: "approved", p_reason: "Operations staff should not be able to do this.",
    });
    expect(error?.message).toMatch(/clinician role required/i);
  });

  it("rejects a stale expected content hash", async () => {
    const { error } = await clinicianClient.rpc("review_brief_version", {
      p_case_id: caseId, p_version_id: versionId,
      p_expected_content_sha256: "b".repeat(64),
      p_decision: "approved", p_reason: "Reviewed a screen that is no longer current.",
    });
    expect(error?.message).toMatch(/content changed/i);
  });

  it("denies a clinician from another clinic", async () => {
    const { data: version } = await admin.from("brief_versions").select("content_sha256").eq("id", versionId).single();
    const { error } = await outsiderClient.rpc("review_brief_version", {
      p_case_id: caseId, p_version_id: versionId,
      p_expected_content_sha256: version!.content_sha256,
      p_decision: "approved", p_reason: "Cross-clinic approval attempt.",
    });
    expect(error).not.toBeNull();

    const { data: visible } = await outsiderClient.from("source_documents").select("id").eq("case_id", caseId);
    expect(visible ?? []).toHaveLength(0);
  });

  it("writes the decision, status and audit event atomically", async () => {
    const { data: version } = await admin.from("brief_versions").select("content_sha256").eq("id", versionId).single();
    const { error } = await clinicianClient.rpc("review_brief_version", {
      p_case_id: caseId, p_version_id: versionId,
      p_expected_content_sha256: version!.content_sha256,
      p_decision: "approved", p_reason: "Verified every citation against its source page.",
    });
    expect(error).toBeNull();

    const { data: stored } = await admin.from("brief_versions").select("status").eq("id", versionId).single();
    expect(stored!.status).toBe("approved");

    const { data: decision } = await admin.from("brief_review_decisions").select("*").eq("brief_version_id", versionId).single();
    expect(decision).toMatchObject({ decision: "approved", reviewer_id: clinicianId });

    const { data: audit } = await admin.from("audit_logs").select("*").eq("entity_id", versionId).eq("action", "brief_approved");
    expect(audit ?? []).toHaveLength(1);
  });

  it("rejects a repeated final decision without overwriting the first", async () => {
    const { data: version } = await admin.from("brief_versions").select("content_sha256").eq("id", versionId).single();
    const { error } = await clinicianClient.rpc("review_brief_version", {
      p_case_id: caseId, p_version_id: versionId,
      p_expected_content_sha256: version!.content_sha256,
      p_decision: "rejected", p_reason: "Second decision on a finalized version.",
    });
    expect(error?.message).toMatch(/already has a final decision/i);

    const { data: stored } = await admin.from("brief_versions").select("status").eq("id", versionId).single();
    expect(stored!.status).toBe("approved");

    const { count } = await admin
      .from("brief_review_decisions")
      .select("*", { count: "exact", head: true })
      .eq("brief_version_id", versionId);
    expect(count).toBe(1);
  });

  it("leaves no audit event behind when a decision fails", async () => {
    const { count } = await admin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("entity_id", versionId);
    expect(count).toBe(1);
  });

  /**
   * Storage policies are the one surface the in-process PostgreSQL harness
   * cannot reach, because objects live in Supabase's storage service rather
   * than in the schema. These assert the private bucket denies cross-clinic
   * access at the object level.
   */
  describe("private source storage", () => {
    const bucket = "clinical-source-pdfs";
    let ownPath: string;
    const pdf = () => new Blob([new TextEncoder().encode("%PDF-1.4 synthetic")], { type: "application/pdf" });

    beforeAll(() => {
      ownPath = `${clinicId}/${caseId}/referral.pdf`;
    });

    it("lets clinic staff upload under their own clinic prefix", async () => {
      await admin.storage.from(bucket).remove([ownPath]);
      const { error } = await staffClient.storage.from(bucket).upload(ownPath, pdf(), { contentType: "application/pdf" });
      expect(error).toBeNull();
    });

    it("denies a clinician from another clinic reading the object", async () => {
      const { data, error } = await outsiderClient.storage.from(bucket).download(ownPath);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it("denies writing outside your own clinic prefix", async () => {
      const { error } = await outsiderClient.storage
        .from(bucket)
        .upload(`${clinicId}/${caseId}/intruder.pdf`, pdf(), { contentType: "application/pdf" });
      expect(error).not.toBeNull();
    });

    it("is not readable without a session", async () => {
      const anon = createClient(url!, anonKey!);
      const { data, error } = await anon.storage.from(bucket).download(ownPath);
      expect(data).toBeNull();
      expect(error).not.toBeNull();

      // And not reachable as a public object either.
      const publicUrl = anon.storage.from(bucket).getPublicUrl(ownPath).data.publicUrl;
      const response = await fetch(publicUrl);
      expect(response.ok).toBe(false);
    });
  });
});
