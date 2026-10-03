# 21 — Auth and Safe Admin Access Decision

## Build

QL-008B — Auth and Safe Admin Access Decision.

## Decision

Use **Supabase Auth + an app-owned admin allowlist** before connecting the frontend to live Supabase data.

The allowlist table is `public.app_admins`.

## Why this path

The Supabase schema now exists, but live customer data access must not be opened until the app has a clear owner/admin gate.

This build keeps the safest order:

1. Database schema exists.
2. RLS stays enabled.
3. Admin access model is defined.
4. Policies are written for authenticated admins only.
5. Frontend live Supabase access waits until the login flow is implemented.

## Roles

```text
owner          Can manage admin allowlist and all app records.
admin          Can operate the inbox and app records.
staff_readonly Can view app records when later used; write limits can be tightened later.
```

QL-008B starts with a simple owner/admin guard. Brand-specific and read-only refinements can be added after login is working.

## App admin table

`public.app_admins` stores:

- `email`
- `role`
- `brand_scope`
- `active`
- audit timestamps

No customer records are seeded by this build.

## RLS policy decision

All application tables stay RLS-enabled.

Authenticated users can access app tables only when `public.is_app_admin()` returns true.

Anonymous users are not granted public table policies.

## Live Supabase status

The Supabase project was connected earlier for QL-008A, but this QL-008B migration was **not applied automatically in this turn** because the currently available Supabase connector context returned a permission error for project `gxujcwpktaickcgzyvnu`.

The repository migration is ready here:

```text
database/migrations/0006_auth_admin_access_policies.sql
```

## Manual application path

Open Supabase SQL Editor for project `gxujcwpktaickcgzyvnu`, review and run:

```text
database/migrations/0006_auth_admin_access_policies.sql
```

Then add the owner allowlist row privately in SQL Editor using your real owner email. Do not commit real passwords, service-role keys, database URLs, or JWT secrets.

Example shape:

```sql
insert into public.app_admins (email, role, brand_scope, active)
values ('owner@example.com', 'owner', array['rosiedazzlers','devilndove'], true)
on conflict (email) do update set
  role = excluded.role,
  brand_scope = excluded.brand_scope,
  active = excluded.active,
  updated_at = now();
```

Replace `owner@example.com` before running.

## Verification queries

### Admin table exists

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'app_admins';
```

### Policies exist

```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### Owner row exists without exposing email in chat

```sql
select role, active, brand_scope
from public.app_admins
where role = 'owner';
```

## Non-goals

- Do not connect the frontend to Supabase live data yet.
- Do not enable customer self-service login yet.
- Do not expose anonymous table reads/writes.
- Do not add phone/SMS provider access.
- Do not enable AI auto-send.
- Do not store customer photos, calls, or production SMS yet.

## Next build

QL-009 should implement the local frontend auth boundary and Supabase client wiring behind a feature flag, but still keep live writes off until login and policies are verified.
