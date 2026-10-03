# 20 — Supabase Migration Verified and Types Generated

## Build

QL-008A — Supabase Migration Verified and Types Generated.

## Result

The Supabase connector is now authorized for the Rosevear Comms Hub Supabase project.

```text
Project name: rosevearcreations Project
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
Region: us-west-2
Status: ACTIVE_HEALTHY
Postgres: 17
```

## Migration applied

The development schema migration was applied successfully through the Supabase connector:

```text
Migration name: ql_007_supabase_dev_schema
Result: success
```

A second safety/performance migration was also applied successfully:

```text
Migration name: ql_007_security_performance_indexes
Result: success
```

That second migration fixed the mutable `search_path` warning for `public.set_updated_at()` and added covering indexes for foreign keys flagged by Supabase performance advisors.

## Verification results

The verification queries confirmed:

- 14 expected public application tables exist.
- Row Level Security is enabled on all 14 expected tables.
- Seed brand rows exist for `devilndove` and `rosiedazzlers`.
- Supabase TypeScript database types were generated.

Expected tables:

```text
ai_draft_replies
audit_events
brands
consent_logs
contact_brand_profiles
contacts
conversation_tags
conversations
follow_up_tasks
intake_requests
messages
phone_calls
phone_numbers
sms_messages
```

Seed brands:

```text
devilndove   DevilnDove      artisan_custom_products  planned
rosiedazzlers RosieDazzlers  mobile_auto_detailing    planned
```

## Advisor results

### Security advisor

Remaining item:

```text
RLS enabled, no policies exist
```

This is intentional for this stage. The app tables are locked down until QL-008B/QL-009 adds an explicit owner/admin access model and RLS policies.

### Performance advisor

Foreign-key covering indexes were added. The remaining `unused_index` notices are expected immediately after a new schema is created because the application has not queried production-style data yet.

## Generated types

The generated Supabase database types are stored at:

```text
app/src/supabase/database.types.ts
```

These types are a snapshot of the current Supabase schema. Regenerate them after future database migrations.

## Current boundaries

The database schema exists, but the frontend is not connected to live Supabase data yet.

Still disabled:

- live customer data entry;
- public website intake;
- phone provider webhooks;
- SMS provider webhooks;
- AI-generated sending;
- call recording;
- number forwarding or porting.

## Next build

Next build should be:

```text
QL-008B — Auth and Safe Admin Access Decision
```

That build should decide how owner/admin users authenticate and how RLS policies should restrict all app data by authorized admin access and brand scope.
