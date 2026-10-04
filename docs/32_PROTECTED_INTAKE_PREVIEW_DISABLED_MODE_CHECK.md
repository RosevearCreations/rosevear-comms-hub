# 32 — Protected Intake Preview Disabled-Mode Check

## Build

QL-019 — Protected Intake Preview Disabled-Mode Check.

## Result

QL-019 adds the disabled-mode check for the preview-capable protected intake route:

```text
/api/intake
```

The check confirms the safe default expectation:

```text
HTTP 503
mode: disabled
accepted: false
```

This is the desired production-green state for this build because the route exists but the endpoint is still off by default.

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
api/deployment/protectedIntakePreviewDisabledModeCheck.ts
api/contracts/protected-intake-preview-disabled-mode-check.example.json
docs/32_PROTECTED_INTAKE_PREVIEW_DISABLED_MODE_CHECK.md
docs/builds/QL-019-protected-intake-preview-disabled-mode-check.md
ops/deployment/protected-intake-preview-disabled-mode-check.md
runtimes/vercel/preview-disabled-mode-check.md
scripts/remote-operator-protected-intake-preview-disabled-mode-check.md
```

## Safe current state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
DEPLOYMENT_TARGET=vercel
DEPLOYMENT_RUNTIME_WRAPPER=vercel_serverless_function
PROTECTED_INTAKE_PREVIEW_ROUTE=/api/intake
PROTECTED_INTAKE_DISABLED_MODE_EXPECTED_STATUS=503
PROTECTED_INTAKE_DISABLED_MODE_EXPECTED_MODE=disabled
PROTECTED_INTAKE_PREVIEW_URL=
```

## Manual input required

No manual input is required to complete the QL-019 repository build.

A live preview check still needs a Vercel preview URL. When a Vercel preview exists, set this server-side or repository/deployment variable:

```text
PROTECTED_INTAKE_PREVIEW_URL=<your Vercel preview URL>
```

Do not put shared secrets in browser-facing `VITE_` variables.

## What must stay server-side only

```text
INTAKE_SHARED_SECRET
DATABASE_URL
DATABASE_READONLY_URL
service-role key
sb_secret_...
JWT secret
connection string
```

## Expected preview check

After the Vercel preview is available, the first check is intentionally disabled-mode only:

```text
POST <preview-url>/api/intake
```

Expected result:

```text
HTTP 503
mode: disabled
accepted: false
```

If the result is anything else, do not enable the endpoint.

## Production GREEN definition

For QL-019, production GREEN means:

```text
main contains the disabled-mode checker and docs
/api/intake remains disabled by default
persistence is disabled
no public website form is connected
no customer data is written
no Supabase migration is required
```

## Non-goals

- Do not enable the endpoint yet.
- Do not enable persistence yet.
- Do not connect RosieDazzlers or DevilnDove forms yet.
- Do not write customer records.
- Do not expose service-role keys, database URLs, JWT secrets, or shared secrets.
- Do not enable public anonymous Supabase write policies.
- Do not enable phone/SMS.
- Do not enable AI auto-send.

## Next build

QL-020 — Protected Intake Preview Enablement Gate.

Goal:

- Confirm preview URL and disabled-mode response evidence.
- Decide whether endpoint enablement can be tested with persistence still disabled.
- Require rate-limit and idempotency decisions before any real form connection.
