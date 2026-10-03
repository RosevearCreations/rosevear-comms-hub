# QL-006 — Supabase Project Setup Gate

## Status

Complete.

## Goal

Record the new Supabase project information and prepare the repository for safe hosted-database migration.

## Supabase project

```text
Project/account name: rosevearcreations
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

## Delivered

- Updated README current stage.
- Added Supabase setup gate documentation.
- Added ADR-0006.
- Added Supabase-ready schema migration.
- Added Supabase environment template.
- Updated build sequence.
- Preserved local-only app operation.
- Preserved no-live-phone/SMS/AI rules.

## Not delivered

The migration was not applied to the live Supabase project because the current Supabase connector does not have permission to access project `gxujcwpktaickcgzyvnu`.

## Green criteria

- Supabase project details are recorded without secrets.
- Migration file exists and is reviewable.
- App still remains local-only.
- No production customer data is used.
- No secrets are committed.
- Next setup gate is clear.

## Next build

QL-007 — Supabase Migration Application and Verification.
