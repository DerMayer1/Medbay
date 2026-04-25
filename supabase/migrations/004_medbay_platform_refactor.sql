alter table leads
  add column if not exists contact text,
  add column if not exists reason_for_visit text,
  add column if not exists preferred_service text,
  add column if not exists urgency_level text,
  add column if not exists availability text,
  add column if not exists payment_type text,
  add column if not exists handoff_required boolean default false;

insert into knowledge_items (category, title, content, active)
values
  ('services', 'Northstar Clinic services', 'Northstar Clinic is a fictional demo clinic offering primary care, dermatology, orthopedics, cardiology, pediatrics, and behavioral health intake workflows.', true),
  ('pricing', 'Demo pricing policy', 'Pricing and insurance details are confirmed by staff. The AI assistant can collect payment type but cannot guarantee coverage.', true),
  ('schedule', 'Demo scheduling hours', 'Demo appointment slots are available Monday through Friday from 9:00 AM to 5:00 PM.', true),
  ('safety', 'AI safety scope', 'The assistant handles administrative intake, scheduling support, knowledge-base answers, and human handoff. It does not provide diagnosis, prescriptions, clinical advice, diet plans, supplement guidance, or exam interpretation.', true)
on conflict do nothing;
