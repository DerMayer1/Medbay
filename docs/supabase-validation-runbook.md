# Supabase Validation Runbook

**Purpose:** apply the Medbay migrations to a disposable Supabase project and close the two
verification gaps that an in-process PostgreSQL harness cannot cover — the storage policies and
JWT-derived `auth.uid()`.

**Status:** not yet executed. This is the last open item in Phase 0.

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

### 4. Verify the storage policies by hand

The automated suite does not cover object-level access. With two clinics seeded:

1. Upload a PDF as clinic A staff to `clinic-a-uuid/case-uuid/file.pdf`.
2. Signed in as clinic B, attempt to download that exact path. It must fail.
3. Attempt an upload to a path **not** prefixed with your own clinic id. It must fail.
4. Confirm the object is not reachable via an unauthenticated public URL.

### 5. Record the outcome

Update `docs/pivot-prd.md` §12 to move storage policies and JWT `auth.uid()` out of
"implemented but not live-validated", and note the date and project used.

## Safety constraints

- Synthetic data only. No real patient information, at any point, for any reason.
- `MEDBAY_PORTFOLIO_ADMIN` must remain unset. The credential-less admin is now refused
  outright whenever a service-role key is present, but do not rely on that as the only control.
- Keep the service-role key out of the browser, out of the repository, and out of CI logs.
- Delete the project when validation is complete, or keep it strictly as a staging environment
  with the same synthetic-only rule.
