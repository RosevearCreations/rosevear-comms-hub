-- QL-005 shared backend foundation
-- Purpose: prepare for a hosted Postgres-compatible database.
-- This migration is a readiness draft and should be reviewed before applying to production.

-- Brand registry keeps brand keys centralized for future auth/RLS rules.
create table if not exists brands (
  id text primary key,
  display_name text not null,
  business_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into brands (id, display_name, business_type)
values
  ('rosiedazzlers', 'RosieDazzlers', 'mobile_auto_detailing'),
  ('devilndove', 'DevilnDove', 'artisan_custom_products')
on conflict (id) do update set
  display_name = excluded.display_name,
  business_type = excluded.business_type,
  is_active = true,
  updated_at = now();

-- Future hosted app users. This does not choose an auth provider yet.
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  role text not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_role_check check (role in ('owner', 'admin', 'brand_operator', 'readonly'))
);

-- Brand access mapping for future row-level security.
create table if not exists app_user_brand_access (
  id uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references app_users(id) on delete cascade,
  brand text not null references brands(id),
  access_level text not null default 'admin',
  created_at timestamptz not null default now(),
  unique(app_user_id, brand),
  constraint app_user_brand_access_level_check check (access_level in ('owner', 'admin', 'operator', 'readonly'))
);

-- Store the data origin for future migrations from local exports.
alter table contacts add column if not exists external_import_id text;
alter table conversations add column if not exists external_import_id text;
alter table messages add column if not exists external_import_id text;
alter table follow_up_tasks add column if not exists external_import_id text;
alter table intake_requests add column if not exists external_import_id text;

-- Attach brand registry references where possible.
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'conversations_brand_fk'
  ) then
    alter table conversations
      add constraint conversations_brand_fk foreign key (brand) references brands(id);
  end if;
exception when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'follow_up_tasks_brand_fk'
  ) then
    alter table follow_up_tasks
      add constraint follow_up_tasks_brand_fk foreign key (brand) references brands(id);
  end if;
exception when undefined_column then null;
exception when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'intake_requests_brand_fk'
  ) then
    alter table intake_requests
      add constraint intake_requests_brand_fk foreign key (brand) references brands(id);
  end if;
exception when undefined_column then null;
exception when duplicate_object then null;
end $$;

-- Indexes for hosted inbox performance.
create index if not exists idx_contacts_external_import_id on contacts(external_import_id);
create index if not exists idx_conversations_external_import_id on conversations(external_import_id);
create index if not exists idx_messages_external_import_id on messages(external_import_id);
create index if not exists idx_follow_up_tasks_external_import_id on follow_up_tasks(external_import_id);
create index if not exists idx_intake_requests_external_import_id on intake_requests(external_import_id);

-- Future row-level security notes:
-- Enable RLS only after auth provider and user-to-brand lookup are implemented.
-- alter table conversations enable row level security;
-- alter table messages enable row level security;
-- alter table follow_up_tasks enable row level security;
-- alter table intake_requests enable row level security;
