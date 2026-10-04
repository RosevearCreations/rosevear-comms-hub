# 30 — Protected Intake Dry-Run Runtime Verification

## Build

QL-017 — Protected Intake Dry-Run Runtime Verification.

## Result

QL-017 adds a dry-run verification plan for the protected website intake runtime path.

This build does not deploy a live endpoint. It does not connect RosieDazzlers or DevilnDove forms. It does not write customer data.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/deployment/protectedIntakeDryRunVerification.ts
api/contracts/protected-intake-dry-run-verification.example.json
docs/30_PROTECTED_INTAKE_DRY_RUN_RUNTIME_VERIFICATION.md
docs/builds/QL-017-protected-intake-dry-run-runtime-verification.md
ops/deployment/protected-intake-dry-run-runtime-verification.md
runtimes/vercel/dry-run-verification.md
scripts/remote-operator-protected-intake-dry-run-runtime-verification.md
```

## What is verified

The verification helper covers these expected response modes:

```text
disabled_gate → 503 disabled, accepted false
invalid_secret → 401 rejected, accepted false
valid_dry_run → 202 dry_run, accepted true
```

The dry-run case verifies that a valid request can pass the protected handler and still avoid persistence when no live repository adapter is wired.

## Current safe state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
DEPLOYMENT_TARGET=vercel
DEPLOYMENT_RUNTIME_WRAPPER=vercel_serverless_function
PROTECTED_INTAKE_DRY_RUN_EXPECTED_MODE=disabled
```

## Manual input required now

No manual input is required for QL-017.

The build only adds the dry-run verifier, fixtures, and operator checklists. It keeps the endpoint disabled.

## Manual input required in a later build

Before QL-018 can move the Vercel wrapper into a real preview route, the operator will need to confirm:

```text
1. Vercel project is connected to RosevearCreations/rosevear-comms-hub.
2. Preview deployment URL exists.
3. Server-side INTAKE_SHARED_SECRET is stored as a secret, not a VITE variable.
4. ALLOWED_INTAKE_ORIGINS is set.
5. ENABLE_PROTECTED_INTAKE_ENDPOINT remains false for the first deploy.
6. ENABLE_INTAKE_PERSISTENCE remains false.
7. No Supabase service-role key is exposed to the browser.
```

## Production GREEN definition

For QL-017, production GREEN means:

```text
main contains the dry-run verification helper and docs
protected intake remains disabled
persistence remains disabled
no public website form is connected
no customer data is written
no Supabase migration is required
```

## Non-goals

- Do not deploy a live endpoint yet.
- Do not connect RosieDazzlers or DevilnDove forms yet.
- Do not write customer records.
- Do not expose service-role keys, database URLs, JWT secrets, or shared secrets.
- Do not enable public anonymous Supabase write policies.
- Do not enable phone/SMS.
- Do not enable AI auto-send.

## Next build

QL-018 — Protected Intake Preview Deployment Wiring.

Goal:

- Decide whether to move the Vercel wrapper template into a real preview route.
- Confirm preview URL, server-side secret placement, allowed origins, rate limiting, and idempotency gate.
- Keep persistence disabled until dry-run preview results are reviewed.
