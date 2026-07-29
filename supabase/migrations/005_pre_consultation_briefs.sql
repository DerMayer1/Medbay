-- Medbay 2.0.1 Stage 1: single-specialty synthetic validation pipeline.
-- This migration is intentionally not applied automatically.

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add column if not exists clinic_id uuid references clinics(id);
alter table profiles add constraint profiles_role_check check (role in ('admin', 'staff', 'clinician'));
alter table leads add column if not exists clinic_id uuid references clinics(id);
alter table audit_logs add column if not exists clinic_id uuid references clinics(id);
insert into clinics (id, name) values ('00000000-0000-4000-8000-000000000001', 'Northstar Clinic') on conflict (id) do nothing;
update profiles set clinic_id = '00000000-0000-4000-8000-000000000001' where clinic_id is null;
update leads set clinic_id = '00000000-0000-4000-8000-000000000001' where clinic_id is null;
update audit_logs set clinic_id = '00000000-0000-4000-8000-000000000001' where clinic_id is null;
alter table profiles alter column clinic_id set not null;
alter table leads alter column clinic_id set not null;
alter table audit_logs alter column clinic_id set not null;
alter table leads drop constraint if exists leads_id_clinic_unique;
alter table leads add constraint leads_id_clinic_unique unique (id, clinic_id);

create table if not exists source_documents (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  case_id uuid not null,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (mime_type = 'application/pdf'),
  byte_size integer not null check (byte_size between 1 and 6291456),
  document_sha256 text not null check (document_sha256 ~ '^[a-f0-9]{64}$'),
  storage_path text not null unique,
  extraction_status text not null default 'extracted' check (extraction_status in ('extracted', 'rejected')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (clinic_id, case_id, document_sha256),
  unique (id, clinic_id),
  foreign key (case_id, clinic_id) references leads(id, clinic_id) on delete cascade
);

create table if not exists source_pages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  document_id uuid not null,
  page_number integer not null check (page_number > 0 and page_number <= 100),
  page_text text not null check (char_length(page_text) > 0),
  text_sha256 text not null check (text_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (document_id, page_number),
  foreign key (document_id, clinic_id) references source_documents(id, clinic_id) on delete cascade
);

create table if not exists brief_versions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  case_id uuid not null,
  version_number integer not null check (version_number > 0),
  schema_version text not null check (schema_version = '2.0.1'),
  specialty text not null check (specialty = 'cardiology'),
  consultation_type text not null check (consultation_type = 'first_consultation'),
  status text not null default 'needs_review' check (status in ('needs_review', 'approved', 'rejected')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  generated_by text not null check (generated_by in ('synthetic_stage_1', 'ai_provider')),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (case_id, version_number),
  unique (id, case_id),
  unique (id, clinic_id),
  foreign key (case_id, clinic_id) references leads(id, clinic_id) on delete cascade
);

alter table brief_versions drop constraint if exists brief_versions_content_hash_check;
alter table brief_versions add constraint brief_versions_content_hash_check
check (content_sha256 = encode(digest(content::text, 'sha256'), 'hex'));

create table if not exists brief_review_decisions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  case_id uuid not null,
  brief_version_id uuid not null unique,
  reviewer_id uuid not null references profiles(id),
  decision text not null check (decision in ('approved', 'rejected')),
  reason text not null check (char_length(btrim(reason)) between 1 and 1000),
  reviewed_content_sha256 text not null check (reviewed_content_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  foreign key (case_id, clinic_id) references leads(id, clinic_id) on delete cascade,
  foreign key (brief_version_id, clinic_id) references brief_versions(id, clinic_id)
);

create index if not exists source_documents_case_idx on source_documents (clinic_id, case_id);
create index if not exists source_pages_document_idx on source_pages (document_id, page_number);
create index if not exists brief_versions_case_idx on brief_versions (clinic_id, case_id, version_number desc);

create or replace function protect_brief_version_content()
returns trigger language plpgsql as $$
begin
  if old.id <> new.id
     or old.clinic_id <> new.clinic_id
     or old.case_id <> new.case_id
     or old.version_number <> new.version_number
     or old.schema_version <> new.schema_version
     or old.specialty <> new.specialty
     or old.consultation_type <> new.consultation_type
     or old.content <> new.content
     or old.content_sha256 <> new.content_sha256
     or old.generated_by <> new.generated_by
     or old.created_by <> new.created_by
     or old.created_at <> new.created_at then
    raise exception 'brief version content is immutable';
  end if;
  if old.status <> 'needs_review' or new.status not in ('approved', 'rejected') then
    raise exception 'invalid brief review transition';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_brief_version_content_trigger on brief_versions;
create trigger protect_brief_version_content_trigger before update on brief_versions
for each row execute function protect_brief_version_content();

create or replace function prevent_clinical_artifact_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'clinical source records are immutable; create a new version';
end;
$$;

drop trigger if exists source_documents_immutable on source_documents;
create trigger source_documents_immutable before update or delete on source_documents
for each row execute function prevent_clinical_artifact_mutation();
drop trigger if exists source_pages_immutable on source_pages;
create trigger source_pages_immutable before update or delete on source_pages
for each row execute function prevent_clinical_artifact_mutation();
drop trigger if exists brief_decisions_immutable on brief_review_decisions;
create trigger brief_decisions_immutable before update or delete on brief_review_decisions
for each row execute function prevent_clinical_artifact_mutation();

alter table clinics enable row level security;
alter table source_documents enable row level security;
alter table source_pages enable row level security;
alter table brief_versions enable row level security;
alter table brief_review_decisions enable row level security;

drop policy if exists "Admins can manage leads" on leads;
create policy "Clinic members manage their leads" on leads for all
using (clinic_id = (select clinic_id from profiles where id = auth.uid()))
with check (clinic_id = (select clinic_id from profiles where id = auth.uid()));

create policy "Members read their clinic" on clinics for select
using (id = (select clinic_id from profiles where id = auth.uid()));

create policy "Members read clinic documents" on source_documents for select
using (clinic_id = (select clinic_id from profiles where id = auth.uid()));
create policy "Staff create clinic documents" on source_documents for insert
with check (
  clinic_id = (select clinic_id from profiles where id = auth.uid())
  and created_by = auth.uid()
  and exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'clinician'))
);

create policy "Members read clinic pages" on source_pages for select
using (clinic_id = (select clinic_id from profiles where id = auth.uid()));
create policy "Staff create clinic pages" on source_pages for insert
with check (
  clinic_id = (select clinic_id from profiles where id = auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'clinician'))
);

create policy "Members read clinic brief versions" on brief_versions for select
using (clinic_id = (select clinic_id from profiles where id = auth.uid()));
create policy "Staff create clinic brief versions" on brief_versions for insert
with check (
  clinic_id = (select clinic_id from profiles where id = auth.uid())
  and created_by = auth.uid()
  and exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'clinician'))
);
create policy "Clinicians finalize clinic brief versions" on brief_versions for update
using (clinic_id = (select clinic_id from profiles where id = auth.uid()) and exists (select 1 from profiles where id = auth.uid() and role = 'clinician'))
with check (clinic_id = (select clinic_id from profiles where id = auth.uid()) and exists (select 1 from profiles where id = auth.uid() and role = 'clinician'));

create policy "Members read clinic review decisions" on brief_review_decisions for select
using (clinic_id = (select clinic_id from profiles where id = auth.uid()));
create policy "Clinicians create review decisions" on brief_review_decisions for insert
with check (
  clinic_id = (select clinic_id from profiles where id = auth.uid())
  and reviewer_id = auth.uid()
  and exists (select 1 from profiles where id = auth.uid() and role = 'clinician')
);

create policy "Clinicians write clinic brief audit events" on audit_logs for insert
with check (
  clinic_id = (select clinic_id from profiles where id = auth.uid())
  and actor = auth.uid()::text
  and exists (select 1 from profiles where id = auth.uid() and role = 'clinician')
);

create or replace function review_brief_version(
  p_case_id uuid,
  p_version_id uuid,
  p_expected_content_sha256 text,
  p_decision text,
  p_reason text
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_brief brief_versions%rowtype;
  v_profile profiles%rowtype;
begin
  if p_decision not in ('approved', 'rejected') or char_length(btrim(p_reason)) not between 1 and 1000 then
    raise exception 'invalid review decision';
  end if;
  select * into v_profile from profiles where id = auth.uid() and role = 'clinician';
  if not found then raise exception 'clinician role required'; end if;
  select * into v_brief from brief_versions where id = p_version_id and case_id = p_case_id for update;
  if not found then raise exception 'brief version not found'; end if;
  if v_brief.clinic_id <> v_profile.clinic_id then raise exception 'brief belongs to another clinic'; end if;
  if v_brief.status <> 'needs_review' then raise exception 'brief version already has a final decision'; end if;
  if v_brief.content_sha256 <> p_expected_content_sha256 then raise exception 'brief content changed; reload before reviewing'; end if;

  insert into brief_review_decisions (clinic_id, case_id, brief_version_id, reviewer_id, decision, reason, reviewed_content_sha256)
  values (v_brief.clinic_id, p_case_id, p_version_id, auth.uid(), p_decision, btrim(p_reason), p_expected_content_sha256);
  update brief_versions set status = p_decision where id = p_version_id;
  insert into audit_logs (clinic_id, actor, action, entity_type, entity_id, metadata)
  values (v_brief.clinic_id, auth.uid()::text, 'brief_' || p_decision, 'brief_version', p_version_id,
    jsonb_build_object('caseId', p_case_id, 'contentSha256', p_expected_content_sha256, 'reason', btrim(p_reason)));
  return jsonb_build_object('versionId', p_version_id, 'status', p_decision, 'reviewerId', auth.uid());
end;
$$;

revoke all on function review_brief_version(uuid, uuid, text, text, text) from public;
grant execute on function review_brief_version(uuid, uuid, text, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clinical-source-pdfs', 'clinical-source-pdfs', false, 6291456, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 6291456, allowed_mime_types = array['application/pdf'];

create policy "Clinic members read private source PDFs" on storage.objects for select to authenticated
using (bucket_id = 'clinical-source-pdfs' and split_part(name, '/', 1)::uuid = (select clinic_id from profiles where id = auth.uid()));
create policy "Clinic staff upload private source PDFs" on storage.objects for insert to authenticated
with check (
  bucket_id = 'clinical-source-pdfs'
  and split_part(name, '/', 1)::uuid = (select clinic_id from profiles where id = auth.uid())
  and exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'clinician'))
);
