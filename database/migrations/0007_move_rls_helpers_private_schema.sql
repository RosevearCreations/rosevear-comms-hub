-- QL-009 security follow-up
-- Rosevear Comms Hub
--
-- Moves SECURITY DEFINER helper functions out of the exposed public schema.
-- Supabase API should not expose these helpers as public RPC endpoints.

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.current_app_user_email()
returns text
language sql
stable
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function app_private.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from public.app_admins
    where active is true
      and lower(email) = app_private.current_app_user_email()
      and role in ('owner', 'admin', 'staff_readonly')
  );
$$;

create or replace function app_private.is_app_owner()
returns boolean
language sql
stable
security definer
set search_path = public, app_private
as $$
  select exists (
    select 1
    from public.app_admins
    where active is true
      and lower(email) = app_private.current_app_user_email()
      and role = 'owner'
  );
$$;

revoke all on function app_private.current_app_user_email() from public;
revoke all on function app_private.is_app_admin() from public;
revoke all on function app_private.is_app_owner() from public;
grant execute on function app_private.current_app_user_email() to authenticated;
grant execute on function app_private.is_app_admin() to authenticated;
grant execute on function app_private.is_app_owner() to authenticated;

-- Recreate policies against app_private helpers.
drop policy if exists app_admins_self_read on public.app_admins;
create policy app_admins_self_read on public.app_admins for select to authenticated
using (active is true and lower(email) = app_private.current_app_user_email());

drop policy if exists app_admins_owner_manage on public.app_admins;
create policy app_admins_owner_manage on public.app_admins for all to authenticated
using (app_private.is_app_owner())
with check (app_private.is_app_owner());

drop policy if exists admin_all_brands on public.brands;
create policy admin_all_brands on public.brands for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_contacts on public.contacts;
create policy admin_all_contacts on public.contacts for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_contact_brand_profiles on public.contact_brand_profiles;
create policy admin_all_contact_brand_profiles on public.contact_brand_profiles for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_conversations on public.conversations;
create policy admin_all_conversations on public.conversations for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_messages on public.messages;
create policy admin_all_messages on public.messages for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_conversation_tags on public.conversation_tags;
create policy admin_all_conversation_tags on public.conversation_tags for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_intake_requests on public.intake_requests;
create policy admin_all_intake_requests on public.intake_requests for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_follow_up_tasks on public.follow_up_tasks;
create policy admin_all_follow_up_tasks on public.follow_up_tasks for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_consent_logs on public.consent_logs;
create policy admin_all_consent_logs on public.consent_logs for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_phone_numbers on public.phone_numbers;
create policy admin_all_phone_numbers on public.phone_numbers for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_phone_calls on public.phone_calls;
create policy admin_all_phone_calls on public.phone_calls for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_sms_messages on public.sms_messages;
create policy admin_all_sms_messages on public.sms_messages for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_ai_draft_replies on public.ai_draft_replies;
create policy admin_all_ai_draft_replies on public.ai_draft_replies for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

drop policy if exists admin_all_audit_events on public.audit_events;
create policy admin_all_audit_events on public.audit_events for all to authenticated using (app_private.is_app_admin()) with check (app_private.is_app_admin());

-- Remove earlier exposed helper functions after policies no longer reference them.
drop function if exists public.is_app_admin();
drop function if exists public.is_app_owner();
drop function if exists public.current_app_user_email();

insert into public.audit_events (entity_type, event_type, details, metadata)
values ('system', 'rls_helpers_moved_private', 'QL-009 moved RLS helper functions to app_private schema.', jsonb_build_object('build','QL-009'));
