-- QL-207 DESIGN ARTIFACT ONLY — NEVER RUN BY CI OR THE CURRENT DEPLOYMENT.
-- Not a supabase/migrations file. Do not apply to production or to an existing
-- Supabase project. Run only after a separate, owner-approved isolated dev
-- project, verified auth identity and RLS test harness exist.
-- Target PostgreSQL 17 (repo supabase/config.toml); private schema intentionally
-- absent from the Data API exposed schema list.

begin;

create schema if not exists ql207_sandbox;

create table if not exists ql207_sandbox.operator_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  organization_id text not null check (organization_id in ('rosiedazzlers','devilndove','icamp','yw')),
  tenant_id text,
  property_id text,
  role text not null check (role in ('viewer','reviewer','manager','owner')),
  active boolean not null default false,
  constraint ql207_member_scope check (
    (organization_id in ('rosiedazzlers','devilndove') and tenant_id is null and property_id is null)
    or (organization_id = 'icamp' and tenant_id is not null and property_id is null)
    or (organization_id = 'yw' and tenant_id is not null)
  )
);

create unique index if not exists ql207_membership_scope_uniq
  on ql207_sandbox.operator_memberships (user_id, organization_id, tenant_id, property_id) nulls not distinct;
create index if not exists ql207_membership_lookup
  on ql207_sandbox.operator_memberships (user_id, organization_id, tenant_id, active);

create table if not exists ql207_sandbox.handoff_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null check (organization_id in ('rosiedazzlers','devilndove','icamp','yw')),
  tenant_id text,
  property_id text,
  source_fixture_id text not null,
  source_reference text not null,
  revision integer not null check (revision > 0),
  stage text not null check (stage in ('triage_note','human_review_needed')),
  actor_id uuid not null references auth.users(id),
  request_key text not null check (length(request_key) between 1 and 128),
  created_at timestamptz not null default now(),
  constraint ql207_snapshot_scope check (
    (organization_id in ('rosiedazzlers','devilndove') and tenant_id is null and property_id is null)
    or (organization_id = 'icamp' and tenant_id is not null and property_id is null)
    or (organization_id = 'yw' and tenant_id is not null and property_id is not null)
  )
);

-- The unique revision supports optimistic concurrency through insert-only
-- versioning; a private server must catch unique violations in a transaction.
create unique index if not exists ql207_snapshot_revision_uniq
  on ql207_sandbox.handoff_snapshots
  (organization_id, tenant_id, property_id, source_fixture_id, revision) nulls not distinct;
create unique index if not exists ql207_request_dedup_uniq
  on ql207_sandbox.handoff_snapshots (actor_id, request_key);
create index if not exists ql207_snapshot_scope_lookup
  on ql207_sandbox.handoff_snapshots (organization_id, tenant_id, property_id, source_fixture_id, revision desc);

alter table ql207_sandbox.operator_memberships enable row level security;
alter table ql207_sandbox.operator_memberships force row level security;
alter table ql207_sandbox.handoff_snapshots enable row level security;
alter table ql207_sandbox.handoff_snapshots force row level security;

-- Fixed administrator-issued membership records, never user_metadata.
create policy ql207_member_self_read on ql207_sandbox.operator_memberships
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy ql207_snapshot_scoped_read on ql207_sandbox.handoff_snapshots
  for select to authenticated
  using (
    (select auth.uid()) is not null and exists (
      select 1 from ql207_sandbox.operator_memberships m
      where m.user_id = (select auth.uid()) and m.active
        and m.organization_id = handoff_snapshots.organization_id
        and m.tenant_id is not distinct from handoff_snapshots.tenant_id
        and (handoff_snapshots.property_id is null
          or m.property_id = handoff_snapshots.property_id
          or (m.property_id is null and m.role in ('manager','owner')))
    )
  );

create policy ql207_snapshot_scoped_insert on ql207_sandbox.handoff_snapshots
  for insert to authenticated
  with check (
    actor_id = (select auth.uid()) and exists (
      select 1 from ql207_sandbox.operator_memberships m
      where m.user_id = (select auth.uid()) and m.active
        and m.role in ('reviewer','manager','owner')
        and m.organization_id = handoff_snapshots.organization_id
        and m.tenant_id is not distinct from handoff_snapshots.tenant_id
        and (handoff_snapshots.property_id is null
          or m.property_id = handoff_snapshots.property_id
          or (m.property_id is null and m.role in ('manager','owner')))
    )
  );

-- No UPDATE / DELETE policies, no privileges granted. The private schema is
-- not exposed by the Data API, and neither anon nor authenticated can use it.
revoke all on schema ql207_sandbox from public, anon, authenticated;
revoke all on all tables in schema ql207_sandbox from public, anon, authenticated;

commit;

-- HOLD: RLS policies are a proposal and cannot be validated by the in-memory
-- UI. To proceed, deploy separately to an isolated DB and test as actual
-- authenticated/anon users, cross-company/tenant/property IDOR, token expiry,
-- actor identity, duplicate keys, stale revisions and direct REST access.
