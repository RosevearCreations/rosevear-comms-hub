-- QL-087 rosevear-comms-hub application foundation.
-- Safe for Supabase GitHub integration: creates read-only synthetic seed tables for app testing.
-- This migration does not enable Phone/SMS providers, callbacks, recordings, archive writes, retention writes, or live pilot runtime.

create table if not exists public.ql_brands (
  id text primary key,
  name text not null,
  context text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ql_synthetic_conversations (
  id text primary key,
  brand_id text not null references public.ql_brands(id) on delete cascade,
  title text not null,
  status text not null,
  summary text not null,
  draft text not null,
  is_synthetic boolean not null default true,
  is_live_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  constraint ql_synthetic_conversations_locked_live check (is_synthetic = true and is_live_enabled = false)
);

create table if not exists public.ql_synthetic_timeline_events (
  id bigserial primary key,
  conversation_id text not null references public.ql_synthetic_conversations(id) on delete cascade,
  sort_order integer not null,
  title text not null,
  detail text not null,
  is_locked_boundary boolean not null default false,
  unique (conversation_id, sort_order)
);

create table if not exists public.ql_readiness_checks (
  id text primary key,
  label text not null,
  status text not null check (status in ('ready', 'blocked', 'planned')),
  detail text not null,
  created_at timestamptz not null default now()
);

alter table public.ql_brands enable row level security;
alter table public.ql_synthetic_conversations enable row level security;
alter table public.ql_synthetic_timeline_events enable row level security;
alter table public.ql_readiness_checks enable row level security;

drop policy if exists ql_brands_read_synthetic on public.ql_brands;
create policy ql_brands_read_synthetic
  on public.ql_brands
  for select
  to anon, authenticated
  using (is_enabled = true);

drop policy if exists ql_conversations_read_synthetic on public.ql_synthetic_conversations;
create policy ql_conversations_read_synthetic
  on public.ql_synthetic_conversations
  for select
  to anon, authenticated
  using (is_synthetic = true and is_live_enabled = false);

drop policy if exists ql_timeline_read_synthetic on public.ql_synthetic_timeline_events;
create policy ql_timeline_read_synthetic
  on public.ql_synthetic_timeline_events
  for select
  to anon, authenticated
  using (exists (
    select 1
    from public.ql_synthetic_conversations c
    where c.id = ql_synthetic_timeline_events.conversation_id
      and c.is_synthetic = true
      and c.is_live_enabled = false
  ));

drop policy if exists ql_readiness_read_public on public.ql_readiness_checks;
create policy ql_readiness_read_public
  on public.ql_readiness_checks
  for select
  to anon, authenticated
  using (true);

insert into public.ql_brands (id, name, context, is_enabled) values
  ('rosie', 'Rosie Dazzlers', 'Mobile detailing', true),
  ('devil', 'Devil n Dove', 'Maker shop', true)
on conflict (id) do update set
  name = excluded.name,
  context = excluded.context,
  is_enabled = excluded.is_enabled;

insert into public.ql_synthetic_conversations (id, brand_id, title, status, summary, draft) values
  ('rosie-ceramic-quote', 'rosie', 'Ceramic quote follow-up', 'review_passed', 'Synthetic ceramic coating follow-up with paint-prep and weather-safe scheduling context.', 'Draft-only sample: confirm vehicle size, explain prep expectations, and offer a weather-safe booking window.'),
  ('rosie-missed-call', 'rosie', 'Missed-call callback sample', 'review_passed', 'Synthetic missed-call card for a detailing appointment after work hours.', 'Draft-only sample: acknowledge the missed call, ask for vehicle size, and suggest AM/PM availability.'),
  ('devil-custom-order', 'devil', 'Custom order clarification sample', 'review_passed', 'Synthetic custom-order question about colour, sizing, and personalization.', 'Draft-only sample: confirm colour, size, personalization limits, and expected making time.'),
  ('devil-maker-story', 'devil', 'Maker story question sample', 'review_passed', 'Synthetic shopper asks about the Devil n Dove meaning and materials.', 'Draft-only sample: explain the Devil barriers / Dove hope theme and invite a specific product question.')
on conflict (id) do update set
  brand_id = excluded.brand_id,
  title = excluded.title,
  status = excluded.status,
  summary = excluded.summary,
  draft = excluded.draft,
  is_synthetic = true,
  is_live_enabled = false;

insert into public.ql_synthetic_timeline_events (conversation_id, sort_order, title, detail, is_locked_boundary) values
  ('rosie-ceramic-quote', 1, 'Synthetic inquiry received', 'Hard-coded website quote sample enters the local-only preview.', false),
  ('rosie-ceramic-quote', 2, 'Detail tabs reviewed', 'Overview, Draft, Timeline, and Safety tabs stay understandable for the selected sample.', false),
  ('rosie-ceramic-quote', 3, 'Runtime stays locked', 'No SMS, call, provider, archive, or retention action is available.', true),
  ('rosie-missed-call', 1, 'Sample selected', 'No phone provider event or call log is loaded.', false),
  ('rosie-missed-call', 2, 'Draft reviewed', 'The Draft tab shows copy clearly without implying delivery.', false),
  ('rosie-missed-call', 3, 'Call action locked', 'The public preview cannot place calls or register callbacks.', true),
  ('devil-custom-order', 1, 'Custom request selected', 'Hard-coded maker-shop sample opens in the browser preview.', false),
  ('devil-custom-order', 2, 'Detail tabs reviewed', 'The tabs organize summary, draft, timeline, and safety information clearly.', false),
  ('devil-custom-order', 3, 'Provider delivery locked', 'No Etsy, SMS, email, callback, or provider account is connected.', true),
  ('devil-maker-story', 1, 'Story sample selected', 'Synthetic brand-story prompt is loaded from local constants.', false),
  ('devil-maker-story', 2, 'Safety reviewed', 'The Safety tab makes locked runtime boundaries visible.', false),
  ('devil-maker-story', 3, 'AI and send locked', 'No AI reply generation or provider send path is enabled.', true)
on conflict (conversation_id, sort_order) do update set
  title = excluded.title,
  detail = excluded.detail,
  is_locked_boundary = excluded.is_locked_boundary;

insert into public.ql_readiness_checks (id, label, status, detail) values
  ('cloudflare-worker-static-assets', 'Cloudflare Worker static assets', 'ready', 'wrangler.jsonc points to app/dist with single-page-application fallback.'),
  ('supabase-github-integration-folder', 'Supabase GitHub integration folder', 'ready', 'Root supabase/ folder now exists for dashboard integration working directory dot.'),
  ('supabase-live-comms-runtime', 'Live communications runtime', 'blocked', 'Phone/SMS providers, callbacks, recordings, archives, retention writes, and live pilot runtime remain disabled.')
on conflict (id) do update set
  label = excluded.label,
  status = excluded.status,
  detail = excluded.detail;
