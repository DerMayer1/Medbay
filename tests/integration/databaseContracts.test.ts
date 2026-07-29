import { beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../fixtures/pglite-database";

/**
 * Stage 1 database gates: immutability, atomicity, clinician-only review,
 * concurrency control and clinic isolation, exercised against a real PostgreSQL
 * engine running in process. Supabase's hosted auth and storage services are
 * shimmed, so the hosted integration is covered separately by
 * `liveDatabase.test.ts`.
 */
const clinicId = "00000000-0000-4000-8000-000000000001";
const otherClinicId = "00000000-0000-4000-8000-000000000002";
const clinicianId = "aaaaaaaa-0000-4000-8000-000000000001";
const staffId = "aaaaaaaa-0000-4000-8000-000000000002";
const outsiderId = "aaaaaaaa-0000-4000-8000-000000000003";
const caseId = "bbbbbbbb-0000-4000-8000-000000000001";
const otherCaseId = "bbbbbbbb-0000-4000-8000-000000000002";
const documentId = "cccccccc-0000-4000-8000-000000000001";

let database: TestDatabase;
let versionCounter = 0;

type BriefVersionRow = { id: string; content_sha256: string; status: string };

async function seedBriefVersion(content: Record<string, unknown> = { purpose: "Source-linked context.", facts: [] }) {
  versionCounter += 1;
  const [row] = await database.asOwner<BriefVersionRow>(
    `insert into brief_versions
       (clinic_id, case_id, version_number, schema_version, specialty, consultation_type, content, generated_by, created_by)
     values ($1, $2, $3, '2.0.1', 'cardiology', 'first_consultation', $4, 'synthetic_stage_1', $5)
     returning id, content_sha256, status`,
    [clinicId, caseId, versionCounter, JSON.stringify(content), clinicianId],
  );
  return row;
}

function review(userId: string, versionId: string, expectedHash: string, decision: string, reason: string, targetCase = caseId) {
  return database.asUser(
    userId,
    `select review_brief_version($1::uuid, $2::uuid, $3::text, $4::text, $5::text)`,
    [targetCase, versionId, expectedHash, decision, reason],
  );
}

beforeAll(async () => {
  database = await createTestDatabase();

  await database.asOwner(`insert into clinics (id, name) values ($1, 'Southpoint Clinic') on conflict do nothing`, [otherClinicId]);
  await database.asOwner(
    `insert into auth.users (id, email) values
       ($1, 'clinician@northstar.test'), ($2, 'staff@northstar.test'), ($3, 'clinician@southpoint.test')`,
    [clinicianId, staffId, outsiderId],
  );
  await database.asOwner(
    `insert into profiles (id, name, role, clinic_id) values
       ($1, 'Dr. Reyes', 'clinician', $4), ($2, 'Ops Staff', 'staff', $4), ($3, 'Dr. Vale', 'clinician', $5)`,
    [clinicianId, staffId, outsiderId, clinicId, otherClinicId],
  );
  await database.asOwner(
    `insert into leads (id, clinic_id, name, status) values ($1, $3, 'Maya Chen', 'opened'), ($2, $4, 'Other Patient', 'opened')`,
    [caseId, otherCaseId, clinicId, otherClinicId],
  );
  await database.asOwner(
    `insert into source_documents (id, clinic_id, case_id, file_name, mime_type, byte_size, document_sha256, storage_path, created_by)
     values ($1, $2, $3, 'referral.pdf', 'application/pdf', 1842, repeat('a', 64), $4, $5)`,
    [documentId, clinicId, caseId, `${clinicId}/${caseId}/referral.pdf`, clinicianId],
  );
  await database.asOwner(
    `insert into source_pages (clinic_id, document_id, page_number, page_text, text_sha256)
     values ($1, $2, 1, 'Recurring palpitations; cardiology follow-up requested.', repeat('b', 64))`,
    [clinicId, documentId],
  );
});

describe("Stage 1 database contracts", () => {
  it("derives the content digest from the stored content", async () => {
    const version = await seedBriefVersion({ purpose: "Source-linked context.", facts: [] });
    expect(version.content_sha256).toMatch(/^[a-f0-9]{64}$/);

    const [check] = await database.asOwner<{ matches: boolean }>(
      `select content_sha256 = encode(digest(content::text, 'sha256'), 'hex') as matches from brief_versions where id = $1`,
      [version.id],
    );
    expect(check.matches).toBe(true);

    // A client-supplied digest cannot displace the derived one.
    const forged = await database.asOwner<BriefVersionRow>(
      `insert into brief_versions
         (clinic_id, case_id, version_number, schema_version, specialty, consultation_type, content, content_sha256, generated_by, created_by)
       values ($1, $2, $3, '2.0.1', 'cardiology', 'first_consultation', $4, repeat('f', 64), 'synthetic_stage_1', $5)
       returning id, content_sha256, status`,
      [clinicId, caseId, ++versionCounter, JSON.stringify({ purpose: "Forged.", facts: [] }), clinicianId],
    );
    expect(forged[0].content_sha256).not.toBe("f".repeat(64));
  });

  it("freezes source records and brief content", async () => {
    const version = await seedBriefVersion();

    expect(await database.errorFrom(() => database.asOwner(
      `update brief_versions set content = '{"purpose":"Rewritten.","facts":[]}'::jsonb where id = $1`, [version.id],
    ))).toMatch(/immutable/i);

    expect(await database.errorFrom(() => database.asOwner(
      `delete from brief_versions where id = $1`, [version.id],
    ))).toMatch(/immutable/i);

    expect(await database.errorFrom(() => database.asOwner(
      `update source_pages set page_text = 'Rewritten page.' where document_id = $1`, [documentId],
    ))).toMatch(/immutable/i);

    expect(await database.errorFrom(() => database.asOwner(
      `delete from source_documents where id = $1`, [documentId],
    ))).toMatch(/immutable/i);
  });

  it("caps a case at five source documents", async () => {
    for (let index = 1; index < 5; index += 1) {
      await database.asOwner(
        `insert into source_documents (clinic_id, case_id, file_name, mime_type, byte_size, document_sha256, storage_path, created_by)
         values ($1, $2, $3, 'application/pdf', 1000, md5(random()::text) || md5(random()::text), $4, $5)`,
        [clinicId, caseId, `extra-${index}.pdf`, `${clinicId}/${caseId}/extra-${index}.pdf`, clinicianId],
      );
    }

    expect(await database.errorFrom(() => database.asOwner(
      `insert into source_documents (clinic_id, case_id, file_name, mime_type, byte_size, document_sha256, storage_path, created_by)
       values ($1, $2, 'sixth.pdf', 'application/pdf', 1000, md5(random()::text) || md5(random()::text), $3, $4)`,
      [clinicId, caseId, `${clinicId}/${caseId}/sixth.pdf`, clinicianId],
    ))).toMatch(/at most five source documents/i);
  });

  it("attaches a document and its pages atomically", async () => {
    const pages = [
      { pageNumber: 1, text: "Referral: chest tightness.", textSha256: "c".repeat(64) },
      // page_number 0 violates the source_pages check, failing mid-transaction.
      { pageNumber: 0, text: "Invalid page.", textSha256: "d".repeat(64) },
    ];
    const doomedId = "dddddddd-0000-4000-8000-000000000001";

    const message = await database.errorFrom(() => database.asUser(
      clinicianId,
      `select attach_source_document($1::uuid, $2::uuid, 'partial.pdf', 1024, $3::text, $4::text, $5::jsonb)`,
      [otherCaseId, doomedId, "e".repeat(64), `${otherClinicId}/${otherCaseId}/partial.pdf`, JSON.stringify(pages)],
    ));
    expect(message).toBeDefined();

    // A surviving document row could never be deleted, and a source with no
    // pages would fail every later brief generation for that case.
    const orphans = await database.asOwner(`select id from source_documents where id = $1`, [doomedId]);
    expect(orphans).toHaveLength(0);
  });

  it("refuses to attach a document with no extracted pages", async () => {
    expect(await database.errorFrom(() => database.asUser(
      outsiderId,
      `select attach_source_document($1::uuid, $2::uuid, 'empty.pdf', 1024, $3::text, $4::text, '[]'::jsonb)`,
      [otherCaseId, "dddddddd-0000-4000-8000-000000000002", "f".repeat(64), `${otherClinicId}/${otherCaseId}/empty.pdf`],
    ))).toMatch(/at least one extracted page/i);
  });

  it("refuses a final decision from operations staff", async () => {
    const version = await seedBriefVersion();
    expect(await database.errorFrom(() => review(staffId, version.id, version.content_sha256, "approved", "Staff should not decide.")))
      .toMatch(/clinician role required/i);

    const [stored] = await database.asOwner<BriefVersionRow>(`select status from brief_versions where id = $1`, [version.id]);
    expect(stored.status).toBe("needs_review");
  });

  it("refuses a stale expected content hash", async () => {
    const version = await seedBriefVersion();
    expect(await database.errorFrom(() => review(clinicianId, version.id, "b".repeat(64), "approved", "Stale screen.")))
      .toMatch(/content changed/i);
  });

  it("isolates clinics from each other", async () => {
    const version = await seedBriefVersion();

    expect(await database.errorFrom(() => review(outsiderId, version.id, version.content_sha256, "approved", "Cross-clinic attempt.")))
      .toBeDefined();

    const visibleDocuments = await database.asUser(outsiderId, `select id from source_documents where case_id = $1`, [caseId]);
    expect(visibleDocuments).toHaveLength(0);

    const visibleVersions = await database.asUser(outsiderId, `select id from brief_versions where case_id = $1`, [caseId]);
    expect(visibleVersions).toHaveLength(0);
  });

  it("writes status, decision and audit event in one transaction", async () => {
    const version = await seedBriefVersion();
    await review(clinicianId, version.id, version.content_sha256, "approved", "Verified every citation against its source page.");

    const [stored] = await database.asOwner<BriefVersionRow>(`select status from brief_versions where id = $1`, [version.id]);
    expect(stored.status).toBe("approved");

    const decisions = await database.asOwner<{ reviewer_id: string; decision: string; reviewed_content_sha256: string }>(
      `select reviewer_id, decision, reviewed_content_sha256 from brief_review_decisions where brief_version_id = $1`, [version.id],
    );
    expect(decisions).toHaveLength(1);
    expect(decisions[0]).toMatchObject({ reviewer_id: clinicianId, decision: "approved", reviewed_content_sha256: version.content_sha256 });

    const audit = await database.asOwner(`select id from audit_logs where entity_id = $1 and action = 'brief_approved'`, [version.id]);
    expect(audit).toHaveLength(1);
  });

  it("rejects a repeated final decision without overwriting the first", async () => {
    const version = await seedBriefVersion();
    await review(clinicianId, version.id, version.content_sha256, "approved", "First and only decision.");

    expect(await database.errorFrom(() => review(clinicianId, version.id, version.content_sha256, "rejected", "Second decision.")))
      .toMatch(/already has a final decision/i);

    const [stored] = await database.asOwner<BriefVersionRow>(`select status from brief_versions where id = $1`, [version.id]);
    expect(stored.status).toBe("approved");
    const decisions = await database.asOwner(`select id from brief_review_decisions where brief_version_id = $1`, [version.id]);
    expect(decisions).toHaveLength(1);
  });

  it("rolls the whole decision back when the audit write fails", async () => {
    const version = await seedBriefVersion();

    // Removing the audit insert policy makes the last statement of the RPC fail.
    // A partial approval would leave the version approved with no audit trail.
    await database.asOwner(`drop policy "Clinicians write clinic brief audit events" on audit_logs`);
    try {
      expect(await database.errorFrom(() => review(clinicianId, version.id, version.content_sha256, "approved", "Audit write will fail.")))
        .toBeDefined();

      const [stored] = await database.asOwner<BriefVersionRow>(`select status from brief_versions where id = $1`, [version.id]);
      expect(stored.status).toBe("needs_review");

      const decisions = await database.asOwner(`select id from brief_review_decisions where brief_version_id = $1`, [version.id]);
      expect(decisions).toHaveLength(0);

      const audit = await database.asOwner(`select id from audit_logs where entity_id = $1`, [version.id]);
      expect(audit).toHaveLength(0);
    } finally {
      await database.asOwner(`
        create policy "Clinicians write clinic brief audit events" on audit_logs for insert
        with check (
          clinic_id = (select clinic_id from profiles where id = auth.uid())
          and actor = auth.uid()::text
          and exists (select 1 from profiles where id = auth.uid() and role = 'clinician')
        )
      `);
    }
  });

  it("still approves normally after the audit policy is restored", async () => {
    const version = await seedBriefVersion();
    await review(clinicianId, version.id, version.content_sha256, "approved", "Verified after policy restoration.");

    const [stored] = await database.asOwner<BriefVersionRow>(`select status from brief_versions where id = $1`, [version.id]);
    expect(stored.status).toBe("approved");
  });

  it("requires a non-empty review reason", async () => {
    const version = await seedBriefVersion();
    expect(await database.errorFrom(() => review(clinicianId, version.id, version.content_sha256, "approved", "   ")))
      .toMatch(/invalid review decision/i);
    expect(await database.errorFrom(() => review(clinicianId, version.id, version.content_sha256, "escalated", "Not a valid decision.")))
      .toMatch(/invalid review decision/i);
  });
});
