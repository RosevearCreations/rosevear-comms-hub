# QL-015 — Protected Intake Deployment Readiness Gate

## Status

Complete.

## Goal

Define the readiness gate before the protected website intake endpoint can be deployed or enabled.

## Scope

- Confirm safe defaults.
- Document required deployment runtime decision.
- Document environment and secret placement.
- Document production green meaning for this stage.
- Keep live intake disabled.
- Keep public anonymous Supabase access disabled.

## Completed

- Added `docs/28_PROTECTED_INTAKE_DEPLOYMENT_READINESS_GATE.md`.
- Added `ops/deployment/protected-intake-readiness-gate.md`.
- Added `ops/deployment/protected-intake-release-checklist.md`.
- Added `scripts/remote-operator-protected-intake-deployment-readiness.md`.
- Added `api/deployment/protectedIntakeDeploymentReadiness.ts`.
- Updated README.
- Updated build sequence.
- Updated environment template.

## Green criteria

- `main` documents the dev → main → production green readiness path.
- Endpoint remains disabled by default.
- Persistence remains disabled by default.
- Secret names are documented without exposing values.
- No new Supabase migration is required.
- No live website form is connected.
- No anonymous Supabase policies are added.

## Current safe state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

## Next build

QL-016 — Deployment Runtime Wrapper Selection.
