# Remote Operator Supabase Verification

Use this checklist when the operator cannot run local Bash and the Supabase connector is not authorized for the target project.

## Target project

```text
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

## Do not share secrets

Do not paste these into chat:

- database password;
- full connection string;
- service-role key;
- JWT secret;
- private API keys.

## Manual migration steps

1. Open the Supabase dashboard.
2. Select project `gxujcwpktaickcgzyvnu`.
3. Open SQL Editor.
4. Review repo file `database/migrations/0004_supabase_dev_schema.sql`.
5. Run the migration once.
6. Run the verification queries below.
7. Paste only the non-secret query results back into chat.

## Table verification

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

## RLS verification

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

## Brand seed verification

```sql
select id, display_name, business_type, status
from public.brands
order by id;
```

Expected ids:

```text
devilndove
rosiedazzlers
```

## After verification

Proceed to the next build only after table, RLS, and seed checks pass.
