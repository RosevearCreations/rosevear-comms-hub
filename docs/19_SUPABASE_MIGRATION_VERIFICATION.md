# 19 — Supabase Migration Application and Verification

## Build

QL-007 — Supabase Migration Application and Verification.

## Intended action

Apply and verify the Supabase development schema for project:

```text
Project name/account: rosevearcreations
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

## Result this build

The migration was **not applied automatically** because the connected Supabase tool still does not have permission to manage project `gxujcwpktaickcgzyvnu`.

Supabase connector check result:

```text
get_project(gxujcwpktaickcgzyvnu) returned: You do not have permission to perform this action.
```

The connected Supabase account can see other projects, but not the new Rosevear Comms Hub project.

## What QL-007 completed

- Rechecked Supabase connector access.
- Confirmed the project is still not accessible through the current connector authorization.
- Preserved the Supabase-ready migration:
  - `database/migrations/0004_supabase_dev_schema.sql`
- Added manual migration and verification instructions.
- Added a migration verification checklist.
- Kept the app local-only.
- Kept phone/SMS/AI disabled.
- Avoided requesting or storing any secrets.

## What QL-007 did not do

- It did not apply SQL to Supabase.
- It did not create or alter live Supabase tables.
- It did not generate TypeScript types from the live project.
- It did not connect the frontend to Supabase.
- It did not enable public read/write policies.
- It did not store service-role keys, database passwords, or connection strings.

## Manual SQL Editor path

Until the connector can access project `gxujcwpktaickcgzyvnu`, the owner can apply the migration manually.

### Step 1 — Open the project

Open Supabase dashboard and select:

```text
gxujcwpktaickcgzyvnu
```

### Step 2 — Open SQL Editor

Use the Supabase SQL Editor.

### Step 3 — Review the migration

Open this repo file:

```text
database/migrations/0004_supabase_dev_schema.sql
```

Review before running.

### Step 4 — Run the migration

Paste the full SQL migration into the SQL Editor and run it once.

The migration is intended for a new development project. It creates tables, enables RLS, and seeds only brand metadata.

### Step 5 — Verify tables

Run:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'brands','contacts','contact_brand_profiles','conversations','messages',
    'conversation_tags','intake_requests','follow_up_tasks','consent_logs',
    'phone_numbers','phone_calls','sms_messages','ai_draft_replies','audit_events'
  )
order by table_name;
```

Expected: all listed tables are returned.

### Step 6 — Verify RLS is enabled

Run:

```sql
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'brands','contacts','contact_brand_profiles','conversations','messages',
    'conversation_tags','intake_requests','follow_up_tasks','consent_logs',
    'phone_numbers','phone_calls','sms_messages','ai_draft_replies','audit_events'
  )
order by relname;
```

Expected: `rls_enabled` is `true` for each listed table.

### Step 7 — Verify brand seed rows

Run:

```sql
select id, display_name, business_type, status
from public.brands
order by id;
```

Expected:

```text
devilndove
rosiedazzlers
```

## Safety note about RLS

The migration enables RLS but intentionally does not add public anonymous policies.

That means the tables should be locked down until a later auth build adds explicit owner/admin access policies.

## Next unblock options

Choose one:

1. Re-authorize the Supabase connector so ChatGPT can access project `gxujcwpktaickcgzyvnu`.
2. Manually run the migration in Supabase SQL Editor and paste back the verification results.
3. Keep the app local-only and continue building non-live UI/auth planning.

## Recommended next build

QL-008 should be one of these depending on what happens next:

- **QL-008A — Supabase Migration Verified and Types Generated** if connector/manual verification succeeds.
- **QL-008B — Auth and Safe Admin Access Decision** if we continue without applying the live migration yet.

Phone/SMS remains out of scope until the shared data layer and admin access are safe.
