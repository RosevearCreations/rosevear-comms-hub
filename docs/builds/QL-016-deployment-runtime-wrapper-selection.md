# QL-016 — Deployment Runtime Wrapper Selection

## Goal

Select the first runtime wrapper path for the protected website intake endpoint while keeping the endpoint disabled and non-public.

## Delivered

```text
runtimes/vercel/api/intake.ts
runtimes/vercel/README.md
api/deployment/runtimeWrapperSelection.ts
ops/deployment/vercel-runtime-wrapper-selection.md
scripts/remote-operator-vercel-runtime-wrapper-checklist.md
docs/29_DEPLOYMENT_RUNTIME_WRAPPER_SELECTION.md
```

## Selected wrapper

```text
vercel_serverless_function
```

## Safety result

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
```

## Acceptance checklist

- [x] Runtime wrapper target selected.
- [x] Wrapper template added outside live route path.
- [x] Runtime selection documented.
- [x] Environment template updated without secrets.
- [x] Build sequence updated.
- [x] README updated.
- [x] No Supabase migration added.
- [x] No anonymous Supabase policies added.
- [x] No live website forms connected.
- [x] No real customer data stored.

## Promotion status

Promoted to dev and main.

For this build, `main` production is GREEN when the repository is in a safe disabled state with the wrapper selected but not active.

## Next

QL-017 — Protected Intake Dry-Run Runtime Verification.
