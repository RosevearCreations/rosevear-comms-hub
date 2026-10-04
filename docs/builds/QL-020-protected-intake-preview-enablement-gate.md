# QL-020 — Protected Intake Preview Enablement Gate

Status: complete.

## Summary

Added the preview enablement decision gate for the protected intake route.

## Green criteria

- `main` contains the gate helper and source-of-truth docs.
- `dev` is promoted to match `main`.
- `ENABLE_PROTECTED_INTAKE_ENDPOINT=false` remains the default.
- `ENABLE_INTAKE_PERSISTENCE=false` remains the default.
- No public website form is connected.
- No customer data is written.
- No Supabase migration is required.

## Files

```text
api/deployment/protectedIntakePreviewEnablementGate.ts
api/contracts/protected-intake-preview-enablement-gate.example.json
docs/33_PROTECTED_INTAKE_PREVIEW_ENABLEMENT_GATE.md
ops/deployment/protected-intake-preview-enablement-gate.md
runtimes/vercel/preview-enablement-gate.md
scripts/remote-operator-protected-intake-preview-enablement-gate.md
```
