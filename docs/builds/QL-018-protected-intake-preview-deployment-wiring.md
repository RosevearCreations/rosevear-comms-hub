# QL-018 — Protected Intake Preview Deployment Wiring

Status: complete.

## Summary

QL-018 adds a preview-capable protected intake route at `api/intake.ts` while keeping the endpoint disabled by default.

## Completed

- Added Vercel-compatible preview route at `api/intake.ts`.
- Added preview wiring helper at `api/deployment/protectedIntakePreviewWiring.ts`.
- Added preview wiring example contract.
- Added source-of-truth documentation.
- Added operator and runtime notes.
- Kept protected intake disabled.
- Kept persistence disabled.
- Kept public website forms disconnected.

## Production GREEN

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
/api/intake exists but returns disabled mode by default
no customer data is written
no Supabase migration is required
```

## Next

QL-019 — Protected Intake Preview Disabled-Mode Check.
