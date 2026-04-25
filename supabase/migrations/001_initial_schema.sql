create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id),
  name text,
  role text not null default 'admin',
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  contact text,
  reason_for_visit text,
  preferred_service text,
  urgency_level text,
  availability text,
  payment_type text,
  handoff_required boolean default false,
  consultation_type text,
  goal text,
  modality text,
  schedule_preference text,
  status text not null default 'new',
  source text not null default 'landing_page',
  notes text,
  summary text,
  notification_failed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_id text,
  lead_id uuid references leads(id) on delete set null,
  status text not null default 'new',
  source text not null default 'landing_page',
  last_intent text,
  handoff_required boolean default false,
  handoff_reason text,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists knowledge_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  start_time timestamptz,
  end_time timestamptz,
  modality text,
  status text not null default 'pending_confirmation',
  google_event_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists conversations_lead_id_idx on conversations(lead_id);
create index if not exists messages_conversation_id_idx on messages(conversation_id);
create index if not exists leads_status_idx on leads(status);
create index if not exists appointments_start_time_idx on appointments(start_time);

insert into knowledge_items (category, title, content, active)
values
  ('services', 'Northstar Clinic services', 'Northstar Clinic is a fictional demo clinic offering primary care, dermatology, orthopedics, cardiology, pediatrics, and behavioral health intake workflows.', true),
  ('safety', 'AI safety scope', 'The assistant handles administrative intake, scheduling support, knowledge-base answers, and human handoff. It does not provide diagnosis, prescriptions, clinical advice, diet plans, supplement guidance, or exam interpretation.', true)
on conflict do nothing;
