# Remote Operator — QL-019 Preview Disabled-Mode Check

## Build

QL-019 — Protected Intake Preview Disabled-Mode Check.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Manual work now

None required for repository promotion.

## Manual work when preview exists

1. Open the Vercel preview URL.
2. Confirm the route path is `/api/intake`.
3. Send a test POST request only after confirming `ENABLE_PROTECTED_INTAKE_ENDPOINT=false`.
4. Confirm the response is `HTTP 503` with `mode: disabled` and `accepted: false`.
5. Record the preview URL in `PROTECTED_INTAKE_PREVIEW_URL`.
6. Do not enable persistence.
7. Do not connect any public website forms.

## Never paste or expose

```text
INTAKE_SHARED_SECRET
DATABASE_URL
DATABASE_READONLY_URL
service-role key
sb_secret_...
JWT secret
connection string
```
