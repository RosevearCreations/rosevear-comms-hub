# QL-007 — Supabase Migration Application and Verification

## Status

Blocked from automatic application by Supabase connector permissions.

## Date

2026-10-03.

## Objective

Apply `database/migrations/0004_supabase_dev_schema.sql` to the owner-supplied Supabase project and verify the resulting tables, RLS state, and brand seed rows.

## Project target

```text
Project name/account: rosevearcreations
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

## Work completed

- Rechecked Supabase connector access.
- Confirmed automatic access is still blocked.
- Added verification source-of-truth doc.
- Added manual SQL Editor steps.
- Added RLS verification query.
- Kept app local-only.
- Kept no-live-phone/SMS/AI boundary.

## Migration status

Not applied by ChatGPT.

Reason:

```text
Supabase connector does not have permission to manage project gxujcwpktaickcgzyvnu.
```

## Green criteria

QL-007 is green only when one of the following is true:

### Automatic route

- Connector can access project `gxujcwpktaickcgzyvnu`.
- Migration applies successfully through `apply_migration`.
- Table verification query returns all expected tables.
- RLS verification query returns enabled for all expected tables.
- TypeScript types are generated.

### Manual route

- Owner runs `database/migrations/0004_supabase_dev_schema.sql` in Supabase SQL Editor.
- Owner verifies all expected tables exist.
- Owner verifies RLS is enabled on expected tables.
- Owner verifies brand seed rows exist.

## Not done

- No frontend Supabase connection.
- No production customer data.
- No auth policies.
- No anonymous public policies.
- No phone/SMS.
- No AI sending.
- No secrets committed.

## Handoff

Continue with either:

- connector reauthorization, then rerun QL-007 automatically;
- manual migration by owner, then verify from results;
- QL-008 auth planning while waiting on project access.
