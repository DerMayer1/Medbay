alter table profiles
  add constraint profiles_role_check
  check (role in ('admin'));

alter table conversations
  add constraint conversations_status_check
  check (status in (
    'new',
    'chatting',
    'collecting_name',
    'collecting_contact',
    'collecting_reason',
    'collecting_service',
    'collecting_urgency',
    'collecting_availability',
    'collecting_payment',
    'qualified',
    'waiting_human',
    'scheduled',
    'lost',
    'resolved',
    'opened',
    'collecting_information',
    'needs_human_review',
    'ready_for_scheduling',
    'appointment_requested',
    'closed',
    'discarded'
  ));

alter table messages
  add constraint messages_role_check
  check (role in ('user', 'assistant', 'system'));

alter table leads
  add constraint leads_status_check
  check (status in (
    'new',
    'chatting',
    'collecting_name',
    'collecting_contact',
    'collecting_reason',
    'collecting_service',
    'collecting_urgency',
    'collecting_availability',
    'collecting_payment',
    'qualified',
    'waiting_human',
    'scheduled',
    'lost',
    'resolved',
    'opened',
    'collecting_information',
    'needs_human_review',
    'ready_for_scheduling',
    'appointment_requested',
    'closed',
    'discarded'
  )),
  add constraint leads_consultation_type_check
  check (consultation_type is null or consultation_type in ('first_consultation', 'return', 'unknown')),
  add constraint leads_modality_check
  check (modality is null or modality in ('online', 'in_person', 'unknown')),
  add constraint leads_source_check
  check (source in ('landing_page', 'demo', 'manual')),
  add constraint leads_urgency_level_check
  check (urgency_level is null or urgency_level in ('low', 'medium', 'high', 'urgent', 'unknown')),
  add constraint leads_payment_type_check
  check (payment_type is null or payment_type in ('insurance', 'self_pay', 'unknown'));

alter table knowledge_items
  add constraint knowledge_items_category_check
  check (category in (
    'services',
    'pricing',
    'schedule',
    'policies',
    'faq',
    'safety'
  ));

alter table appointments
  add constraint appointments_status_check
  check (status in ('requested', 'under_review', 'slot_offered', 'confirmed', 'cancelled', 'completed', 'pending_confirmation')),
  add constraint appointments_modality_check
  check (modality is null or modality in ('online', 'in_person', 'virtual', 'phone', 'unknown'));

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_leads_updated_at on leads;
create trigger set_leads_updated_at
before update on leads
for each row execute function set_updated_at();

drop trigger if exists set_conversations_updated_at on conversations;
create trigger set_conversations_updated_at
before update on conversations
for each row execute function set_updated_at();

drop trigger if exists set_knowledge_items_updated_at on knowledge_items;
create trigger set_knowledge_items_updated_at
before update on knowledge_items
for each row execute function set_updated_at();

drop trigger if exists set_appointments_updated_at on appointments;
create trigger set_appointments_updated_at
before update on appointments
for each row execute function set_updated_at();
