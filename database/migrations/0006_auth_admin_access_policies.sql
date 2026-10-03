-- QL-008B Auth and Safe Admin Access Decision
-- Rosevear Comms Hub
--
-- Safe intent:
-- - Add owner/admin allowlist table.
-- - Add authenticated-only admin RLS policies.
-- - Do not grant anonymous public access.
-- - Do not connect frontend live data yet.
-- - Do not enable phone/SMS/AI sending.
--
-- Owner seeding is intentionally not hardcoded in this repo migration.
-- Add the owner row in Supabase SQL Editor or through a private data migration:
-- insert into public.app_admins (email, role, brand_scope, active)
-- values ('owner@example.com', 'owner', array['rosiedazzlers','devilndove'], true)
-- on conflict (email) do update set role = excluded.role, brand_scope = excluded.brand_scope, active = excluded.active, updated_at = now();

create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin' check (role in ('owner', 'admin', 'staff_readonly')),
  brand_scope text[] not null default array['rosiedazzlers','devilndove'],
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_admins_email_active on public.app_admins (lower(email), active);
create index if not exists idx_app_admins_role_active on public.app_admins (role, active);

alter table public.app_admins enable row level security;

drop trigger if exists app_admins_set_updated_at on public.app_admins;
create trigger app_admins_set_updated_at
before update on public.app_admins
for each row
execute function public.set_updated_at();

create or replace function public.current_app_user_email()
returns text
language sql
stable
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where active is true
      and lower(email) = public.current_app_user_email()
      and role in ('owner', 'admin', 'staff_readonly')
  );
$$;

create or replace function public.is_app_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where active is true
      and lower(email) = public.current_app_user_email()
      and role = 'owner'
  );
$$;

revoke all on function public.current_app_user_email() from public;
revoke all on function public.is_app_admin() from public;
revoke all on function public.is_app_owner() from public;
grant execute on function public.current_app_user_email() to authenticated;
grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.is_app_owner() to authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

drop policy if exists app_admins_self_read on public.app_admins;
create policy app_admins_self_read
on public.app_admins
for select
to authenticated
using (active is true and lower(email) = public.current_app_user_email());

drop policy if exists app_admins_owner_manage on public.app_admins;
create policy app_admins_owner_manage
on public.app_admins
for all
to authenticated
using (public.is_app_owner())
with check (public.is_app_owner());

drop policy if exists admin_all_brands on public.brands;
create policy admin_all_brands on public.brands for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_contacts on public.contacts;
create policy admin_all_contacts on public.contacts for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_contact_brand_profiles on public.contact_brand_profiles;
create policy admin_all_contact_brand_profiles on public.contact_brand_profiles for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_conversations on public.conversations;
create policy admin_all_conversations on public.conversations for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_messages on public.messages;
create policy admin_all_messages on public.messages for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_conversation_tags on public.conversation_tags;
create policy admin_all_conversation_tags on public.conversation_tags for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_intake_requests on public.intake_requests;
create policy admin_all_intake_requests on public.intake_requests for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_follow_up_tasks on public.follow_up_tasks;
create policy admin_all_follow_up_tasks on public.follow_up_tasks for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_consent_logs on public.consent_logs;
create policy admin_all_consent_logs on public.consent_logs for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_phone_numbers on public.phone_numbers;
create policy admin_all_phone_numbers on public.phone_numbers for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_phone_calls on public.phone_calls;
create policy admin_all_phone_calls on public.phone_calls for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_sms_messages on public.sms_messages;
create policy admin_all_sms_messages on public.sms_messages for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_ai_draft_replies on public.ai_draft_replies;
create policy admin_all_ai_draft_replies on public.ai_draft_replies for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists admin_all_audit_events on public.audit_events;
create policy admin_all_audit_events on public.audit_events for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

comment on table public.app_admins is 'Owner/admin allowlist for Rosevear Comms Hub. No anonymous users should have access.';
comment on function public.is_app_admin() is 'Checks whether the authenticated user email is an active Rosevear Comms Hub admin.';
comment on function public.is_app_owner() is 'Checks whether the authenticated user email is the active Rosevear Comms Hub owner.';
