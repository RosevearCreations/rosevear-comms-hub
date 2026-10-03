-- QL-008A Supabase safety/performance follow-up
-- Rosevear Comms Hub
--
-- Applied after 0004_supabase_dev_schema.sql.
-- Fixes the mutable search_path advisor for set_updated_at()
-- and adds covering indexes for foreign keys flagged by Supabase advisors.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists idx_ai_draft_replies_conversation_id on public.ai_draft_replies(conversation_id);
create index if not exists idx_audit_events_brand on public.audit_events(brand);
create index if not exists idx_consent_logs_brand on public.consent_logs(brand);
create index if not exists idx_consent_logs_contact_id on public.consent_logs(contact_id);
create index if not exists idx_contact_brand_profiles_brand on public.contact_brand_profiles(brand);
create index if not exists idx_conversations_contact_id on public.conversations(contact_id);
create index if not exists idx_follow_up_tasks_contact_id on public.follow_up_tasks(contact_id);
create index if not exists idx_follow_up_tasks_conversation_id on public.follow_up_tasks(conversation_id);
create index if not exists idx_intake_requests_contact_id on public.intake_requests(contact_id);
create index if not exists idx_intake_requests_conversation_id on public.intake_requests(conversation_id);
create index if not exists idx_phone_calls_contact_id on public.phone_calls(contact_id);
create index if not exists idx_phone_calls_conversation_id on public.phone_calls(conversation_id);
create index if not exists idx_sms_messages_contact_id on public.sms_messages(contact_id);
create index if not exists idx_sms_messages_conversation_id on public.sms_messages(conversation_id);
