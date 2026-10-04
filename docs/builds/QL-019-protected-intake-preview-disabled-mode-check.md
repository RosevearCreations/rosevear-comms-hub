# QL-019 — Protected Intake Preview Disabled-Mode Check

## Status

Complete.

## Scope

Add a repository-level disabled-mode verification helper and operating checklist for the preview-capable `/api/intake` route.

## Completed

- Added disabled-mode contract and preview check helper.
- Added expected response fixture.
- Added source-of-truth documentation.
- Added Vercel/operator notes.
- Preserved safe defaults.

## Green criteria

```text
/api/intake exists
expected disabled result is documented
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
no public form is connected
no customer data is written
no Supabase migration is required
```

## Manual setup

No manual setup is required for the repository build.

A later live preview check requires a Vercel preview URL stored as `PROTECTED_INTAKE_PREVIEW_URL`.
