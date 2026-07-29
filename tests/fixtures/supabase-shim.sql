-- Minimal stand-ins for the Supabase-managed surfaces the migrations depend on,
-- so the Stage 1 schema can be applied to a plain PostgreSQL instance.
--
-- auth.uid() reads a session GUC instead of a JWT, which is how the tests
-- switch between the clinician, the operations staff member and a clinician
-- from another clinic. Everything else in the migrations is stock PostgreSQL.

create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key,
  email text
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('medbay.test_user_id', true), '')::uuid;
$$;

-- Storage objects are exercised by the Supabase-hosted suite; here the tables
-- exist only so the bucket and policy statements in migration 005 apply.
create table if not exists storage.buckets (
  id text primary key,
  name text,
  public boolean,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid
);

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end $$;

grant usage on schema public, auth, storage to authenticated, anon;
