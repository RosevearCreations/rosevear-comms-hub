# Remote Operator Checklist — QL-016 Vercel Runtime Wrapper Selection

## No action required now

QL-016 does not require you to connect Vercel, Cloudflare, phone/SMS, or any other outside app.

## Confirm current repo state

```text
Repo: RosevearCreations/rosevear-comms-hub
Branch: main
Current build: QL-016 — Deployment Runtime Wrapper Selection
Selected wrapper: vercel_serverless_function
Template path: runtimes/vercel/api/intake.ts
```

## Keep disabled

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
```

## Do not add secrets to chat

Never paste:

```text
INTAKE_SHARED_SECRET
service-role key
database password
DATABASE_URL
JWT secret
```

## Next build setup likely needed

QL-017 may require a preview deployment target so the wrapper can be tested in dry-run mode.

Do not enable live intake or persistence until that preview test is complete.
