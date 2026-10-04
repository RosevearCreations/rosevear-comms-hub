# Vercel Dry-Run Verification Notes

QL-017 keeps the Vercel wrapper under `runtimes/vercel/` and does not move it into the root live API route.

## Current wrapper template

```text
runtimes/vercel/api/intake.ts
```

## Current verification helper

```text
api/deployment/protectedIntakeDryRunVerification.ts
```

## First live-preview expectation

The first preview deployment should keep:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

That confirms the route cannot accept live intake while the gate is off.

## Later dry-run expectation

Only after secret placement and allowed origins are reviewed, preview testing may temporarily use:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=true
ENABLE_INTAKE_PERSISTENCE=false
```

Expected valid request response:

```json
{
  "accepted": true,
  "mode": "dry_run"
}
```

Do not enable persistence during Vercel preview verification.
