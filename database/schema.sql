-- Rosevear Comms Hub schema draft
-- QL-001 documentation-stage schema. Review before production use.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  primary_brand text,
  name text,
  email text,
  phone text,
  town text,
  customer_type text default 'lead',
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contact_brand_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id),
  brand text not null,
  status text default 'active',
  lead_quality text default 'unknown',
  last_contacted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contact_id, brand)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  contact_id uuid references contacts(id),
  source_channel text not null,
  status text not null default 'new',
  priority text default 'normal',
  subject text,
  summary text,
  assigned_to text,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  conversation_id uuid not null references conversations(id),
  contact_id uuid references contacts(id),
  direction text not null,
  channel text not null,
  body text,
  media_urls_json jsonb default '[]'::jsonb,
  ai_generated boolean not null default false,
  human_approved boolean not null default false,
  approved_by text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists intake_requests (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  contact_id uuid references contacts(id),
  conversation_id uuid references conversations(id),
  intake_type text not null,
  status text not null default 'new',
  raw_answers_json jsonb default '{}'::jsonb,
  recommended_service text,
  estimated_price_min numeric,
  estimated_price_max numeric,
  needs_human_review boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  contact_id uuid references contacts(id),
  conversation_id uuid references conversations(id),
  title text not null,
  description text,
  due_at timestamptz,
  priority text default 'normal',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  name text not null,
  slug text not null,
  description text,
  active boolean not null default true,
  unique(brand, slug)
);

create table if not exists conversation_tags (
  conversation_id uuid not null references conversations(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key(conversation_id, tag_id)
);

create table if not exists phone_calls (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  contact_id uuid references contacts(id),
  conversation_id uuid references conversations(id),
  direction text not null,
  from_number text,
  to_number text,
  provider text,
  provider_call_id text,
  status text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  recording_url text,
  voicemail_url text,
  transcript text,
  ai_summary text,
  follow_up_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists sms_messages (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  contact_id uuid references contacts(id),
  conversation_id uuid references conversations(id),
  direction text not null,
  from_number text,
  to_number text,
  body text,
  media_urls_json jsonb default '[]'::jsonb,
  provider text,
  provider_message_id text,
  status text,
  ai_generated boolean not null default false,
  human_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists ai_draft_replies (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  conversation_id uuid not null references conversations(id),
  draft_body text not null,
  purpose text,
  confidence numeric,
  missing_info_json jsonb default '[]'::jsonb,
  approved boolean not null default false,
  approved_by text,
  sent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists consent_logs (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  contact_id uuid references contacts(id),
  consent_type text not null,
  consent_source text,
  consent_text text,
  consented_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  brand text,
  actor_id text,
  entity_type text not null,
  entity_id text not null,
  event_type text not null,
  event_data_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
