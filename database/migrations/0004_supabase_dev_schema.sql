-- QL-006 Supabase development schema
-- Rosevear Comms Hub
--
-- Safe intent:
-- - Create initial app tables for a NEW development Supabase project.
-- - Enable RLS without public policies.
-- - Seed only brand metadata.
-- - Do not insert real customer data.
--
-- Do not run on an existing production database without review.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.brands (
  id text primary key,
  display_name text not null,
  business_type text not null,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  primary_brand text references public.brands(id),
  name text not null default 'Unnamed contact',
  email text,
  phone text,
  town text,
  customer_type text not null default 'lead',
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_brand_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  brand text not null references public.brands(id),
  status text not null default 'active',
  lead_quality text not null default 'unknown',
  last_contacted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contact_id, brand)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  brand text not null references public.brands(id),
  contact_id uuid references public.contacts(id) on delete set null,
  source_channel text not null,
  status text not null default 'new',
  priority text not null default 'normal',
  subject text,
  summary text,
  assigned_to uuid,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null,
  channel text not null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  ai_generated boolean not null default false,
  human_approved boolean not null default false,
  approved_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_tags (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(conversation_id, tag)
);

create table if not exists public.intake_requests (
  id uuid primary key default gen_random_uuid(),
  brand text not null references public.brands(id),
  contact_id uuid references public.contacts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  intake_type text not null,
  raw_answers jsonb not null default '{}'::jsonb,
  flags text[] not null default '{}',
  recommended_service text,
  estimated_price_min numeric(10,2),
  estimated_price_max numeric(10,2),
  status text not null default 'needs_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  brand text not null references public.brands(id),
  contact_id uuid references public.contacts(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'open',
  priority text not null default 'normal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  brand text references public.brands(id),
  consent_type text not null,
  consent_source text not null,
  consent_text text,
  consented_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  brand text not null references public.brands(id),
  number text not null,
  provider text not null,
  active boolean not null default false,
  label text,
  business_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(brand, number)
);

create table if not exists public.phone_calls (
  id uuid primary key default gen_random_uuid(),
  brand text not null references public.brands(id),
  contact_id uuid references public.contacts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  direction text not null,
  from_number text,
  to_number text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  status text not null default 'logged',
  provider_call_id text,
  recording_url text,
  voicemail_url text,
  transcript text,
  ai_summary text,
  ai_tags text[] not null default '{}',
  follow_up_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  brand text not null references public.brands(id),
  contact_id uuid references public.contacts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  direction text not null,
  from_number text,
  to_number text,
  body text not null,
  media_urls jsonb not null default '[]'::jsonb,
  provider_message_id text,
  status text not null default 'logged',
  ai_generated boolean not null default false,
  human_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_draft_replies (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  draft_body text not null,
  confidence numeric(4,3),
  missing_info text[] not null default '{}',
  approved boolean not null default false,
  sent boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  brand text references public.brands(id),
  actor_id uuid,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  details text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_contacts_primary_brand on public.contacts(primary_brand);
create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_contacts_phone on public.contacts(phone);
create index if not exists idx_conversations_brand_status on public.conversations(brand, status);
create index if not exists idx_conversations_last_activity on public.conversations(last_activity_at desc);
create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at);
create index if not exists idx_intake_requests_brand_status on public.intake_requests(brand, status);
create index if not exists idx_follow_up_tasks_brand_status on public.follow_up_tasks(brand, status);
create index if not exists idx_phone_calls_brand_status on public.phone_calls(brand, status);
create index if not exists idx_sms_messages_brand_status on public.sms_messages(brand, status);
create index if not exists idx_audit_events_entity on public.audit_events(entity_type, entity_id);
create index if not exists idx_audit_events_created on public.audit_events(created_at desc);

alter table public.brands enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_brand_profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_tags enable row level security;
alter table public.intake_requests enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.consent_logs enable row level security;
alter table public.phone_numbers enable row level security;
alter table public.phone_calls enable row level security;
alter table public.sms_messages enable row level security;
alter table public.ai_draft_replies enable row level security;
alter table public.audit_events enable row level security;

insert into public.brands (id, display_name, business_type, status)
values
  ('rosiedazzlers', 'RosieDazzlers', 'mobile_auto_detailing', 'planned'),
  ('devilndove', 'DevilnDove', 'artisan_custom_products', 'planned')
on conflict (id) do update set
  display_name = excluded.display_name,
  business_type = excluded.business_type,
  status = excluded.status,
  updated_at = now();

comment on table public.brands is 'Brand workspaces for Rosevear Comms Hub.';
comment on table public.conversations is 'Brand-specific customer communication threads.';
comment on table public.messages is 'Inbound, outbound, and internal conversation messages. AI-generated outgoing messages must be human-approved before sending.';
comment on table public.phone_calls is 'Future phone-call records. No live provider is connected in QL-006.';
comment on table public.sms_messages is 'Future SMS records. No live provider is connected in QL-006.';
