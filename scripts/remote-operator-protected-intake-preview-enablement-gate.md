# Remote Operator Checklist — Protected Intake Preview Enablement Gate

## QL-020 objective

Confirm the conditions that must be met before preview dry-run enablement can be tested.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Current required state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
PROTECTED_INTAKE_ENABLEMENT_GATE_STATUS=hold
PROTECTED_INTAKE_ENABLEMENT_ALLOWED=false
```

## Manual setup later

```text
1. Open the Vercel project when it exists.
2. Copy the preview URL.
3. Store the preview URL as PROTECTED_INTAKE_PREVIEW_URL.
4. Confirm POST /api/intake returns HTTP 503 while disabled.
5. Store INTAKE_SHARED_SECRET only as a server-side secret.
6. Confirm ALLOWED_INTAKE_ORIGINS.
7. Approve rate limiting.
8. Approve idempotency.
9. Keep ENABLE_INTAKE_PERSISTENCE=false.
10. Keep public forms disconnected.
```

## Stop conditions

Stop if a secret is placed in a `VITE_` variable, if the endpoint returns stored mode, or if a public form is connected before dry-run review.
