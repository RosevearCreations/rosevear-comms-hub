# 18 — Supabase Project Setup Gate

## Build

QL-006 — Supabase Project Setup Gate.

## Owner-supplied Supabase project

The owner reported a Supabase account/project for this application:

```text
Account/project name: rosevearcreations
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

## Connector status

The connected Supabase tool account currently lists existing projects such as YardWeasels and RosieDazzlers, but it does not have permission to access project `gxujcwpktaickcgzyvnu`.

Result:

```text
Supabase project exists from the owner side, but ChatGPT's connected Supabase tool cannot manage it yet.
```

## What QL-006 does

- Records the Supabase project details in the repo.
- Adds a Supabase setup checklist.
- Adds a Supabase-ready migration file:
  - `database/migrations/0004_supabase_dev_schema.sql`
- Adds a Supabase environment template:
  - `database/supabase/env-template.md`
- Keeps the app local-only until credentials and permissions are safe.

## What QL-006 does not do

- It does not apply the migration to Supabase.
- It does not request or store database passwords.
- It does not request or store service-role keys.
- It does not connect the app to Supabase.
- It does not enable public website intake.
- It does not enable phone/SMS/AI.

## Why the migration was not applied automatically

The current Supabase connector returned a permission error for the supplied project ref.

To apply migrations through ChatGPT later, the Supabase connector must be authorized for this project/organization.

Manual alternative:

1. Open the Supabase dashboard.
2. Open project `gxujcwpktaickcgzyvnu`.
3. Open SQL Editor.
4. Review `database/migrations/0004_supabase_dev_schema.sql`.
5. Run it only when ready.
6. Run the verification query documented below.

## Safe migration policy

The QL-006 migration is designed for a new development project.

It creates the initial application tables and enables RLS. It does **not** insert production customers. It does **not** create public access policies. No anonymous user should be able to read or write app tables until auth/RLS policies are intentionally added in a later build.

## Verification query after migration

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

Expected result: all listed tables should exist.

## Setup still needed before live app connection

- Supabase project access through the connector or manual dashboard.
- A safe secret storage location for project URL, publishable key, service-role key, and database URL.
- Auth decision: Supabase Auth first, or app-owned auth later.
- Hosting decision.
- Migration application decision.

## QL-007 handoff

QL-007 should be **Supabase Migration Application and Verification**.

It should:

- apply the migration if connector permission is available;
- otherwise provide exact manual SQL steps;
- verify table creation;
- verify RLS is enabled;
- generate TypeScript types if possible;
- keep app data local until auth/secrets are ready.

Phone/SMS still waits.
