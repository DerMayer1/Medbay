alter table profiles enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table knowledge_items enable row level security;
alter table appointments enable row level security;
alter table audit_logs enable row level security;

create policy "Admins can read profiles"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can manage leads"
  on leads for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can manage conversations"
  on conversations for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can manage messages"
  on messages for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can manage knowledge"
  on knowledge_items for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can manage appointments"
  on appointments for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins can read audit logs"
  on audit_logs for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
