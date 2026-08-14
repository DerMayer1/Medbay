# Supabase Validation Runbook

**Purpose:** apply the Medbay migrations to a disposable Supabase project and close the two
verification gaps that an in-process PostgreSQL harness cannot cover — the storage policies and
JWT-derived `auth.uid()`.

**Status:** executed 2026-08-04 against project `plqnlmvscfzqlofhegri`. Migration 005 applied
cleanly, all 13 live gates pass including the storage policies. Phase 0 is closed.

Keep this document: it is the procedure for any future environment, and the migration has still
only been applied to one project.

## What is already proven without this

`tests/integration/databaseContracts.test.ts` applies every migration to an in-process
PostgreSQL 18 instance via PGlite and asserts the immutability triggers, clinic-scoped RLS,
the document budget, the derived content digest, and transaction rollback. That harness
shims Supabase's `auth` and `storage` schemas, so what it cannot prove is:

- the private bucket's storage policies actually deny cross-clinic object reads
- `auth.uid()` resolves correctly from a real Supabase JWT rather than a session setting
- the migrations apply cleanly against a managed project, including its default roles and grants

## Prerequisites

- A Supabase project used for nothing else. It will hold synthetic data only.
- The project URL, anon key and service-role key.
- `npx supabase` (already a dev dependency of this repository).

## Steps

### 1. Apply the migrations

Either link the CLI to the project and push:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Or paste the contents of `supabase/migrations/*.sql` into the SQL editor **in filename order**.
Order matters: `005` depends on tables and the `pgcrypto` extension created in `001`.

### 2. Confirm the schema landed

In the SQL editor:

```sql
select tablename from pg_tables
where schemaname = 'public'
  and tablename in ('clinics','source_documents','source_pages','brief_versions','brief_review_decisions');

select proname from pg_proc
where proname in ('review_brief_version','attach_source_document');

select id, public, file_size_limit from storage.buckets where id = 'clinical-source-pdfs';
```

Expect five tables, two functions, and one bucket with `public = false`.

### 3. Run the live suite

```bash
SUPABASE_TEST_URL=https://<project-ref>.supabase.co \
SUPABASE_TEST_SERVICE_ROLE_KEY=<service-role-key> \
SUPABASE_TEST_ANON_KEY=<anon-key> \
npx vitest run tests/integration/liveDatabase.test.ts
```

The suite creates its own users, profiles and clinics, then asserts the derived digest,
immutability, the document budget, non-clinician rejection, stale-hash rejection,
cross-clinic denial, atomic review, and repeated-decision conflict.

> This suite has never been executed. Expect to fix setup details on the first run — most
> likely around user creation or profile role seeding. Failures there are the harness
> catching up with the managed environment, not necessarily schema defects. Read each
> failure before changing any migration.

### 4. Storage policies

These were originally a manual checklist. They are now automated in the same suite, under
`private source storage`: upload beneath your own clinic prefix succeeds, a clinician from
another clinic cannot download the object, writing outside your own prefix is denied, and the
object is unreachable both without a session and via a public URL.

### 5. Record the outcome

Update `docs/pivot-prd.md` §12 and §14 with the date and project used.

## Test data accumulates by design

Every run creates three auth users, a clinic pair, a case, source documents and brief versions.
The immutability triggers mean brief versions, source documents, source pages and review
decisions **cannot be deleted afterwards** — that is the property under test, not a defect.

Run this against a project you can afford to pollute. After the first two runs against
`plqnlmvscfzqlofhegri` the project held 7 auth users. If accumulation becomes a problem, create a
fresh project rather than trying to clean up, because the interesting rows are the ones the
schema refuses to remove.

## Safety constraints

- Synthetic data only. No real patient information, at any point, for any reason.
- `MEDBAY_PORTFOLIO_ADMIN` must remain unset. The credential-less admin is now refused
  outright whenever a service-role key is present, but do not rely on that as the only control.
- Keep the service-role key out of the browser, out of the repository, and out of CI logs.
- Delete the project when validation is complete, or keep it strictly as a staging environment
  with the same synthetic-only rule.
