# 28 — Protected Intake Deployment Readiness Gate

## Build

QL-015 — Protected Intake Deployment Readiness Gate.

## Result

QL-015 defines the deployment readiness gate for the protected website intake endpoint before any real RosieDazzlers or DevilnDove form submits customer data into the hub.

This is a readiness and promotion-control build. It does not enable live website intake, does not create public anonymous Supabase policies, and does not write production customer records.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## Promotion path

QL-015 was prepared for the requested promotion path:

```text
dev → main → production green readiness
```

For this repository, production green means the main branch contains the readiness-gated code and documentation, with live intake still disabled until an actual deployment target and secret placement are reviewed.

## Deployment target decision

The first recommended deployment target for the protected intake endpoint is:

```text
Vercel serverless function or Cloudflare Pages Function, depending on where the hub app is hosted.
```

Do not choose a final runtime only from this repository. The final runtime should match the deployed admin app location so auth redirect URLs, environment variables, logs, and future rate limits are easier to manage.

## Gate decision

QL-015 keeps the endpoint disabled by default.

Safe defaults:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

Server-only secret required later:

```text
INTAKE_SHARED_SECRET=<long random server-side secret>
```

Do not prefix `INTAKE_SHARED_SECRET` with `VITE_`.

## Required before enabling real intake

Do not turn on live intake until all of these are complete:

1. Select the deployment target.
2. Add a runtime wrapper for that target.
3. Confirm server-only environment variable storage.
4. Add rate limiting or abuse control.
5. Add idempotency / duplicate-submission protection.
6. Add a reviewed server-side Supabase persistence adapter.
7. Run dry-run payload tests for RosieDazzlers and DevilnDove.
8. Confirm logs do not expose secrets or full private customer data.
9. Confirm CORS/origin behavior for the live websites.
10. Confirm admin review remains required before any customer reply.

## Approved origins draft

```text
https://rosiedazzlers.ca
https://devilndove.com
https://devilndove.online
```

Preview origins may be added later only for a named preview deployment.

## Environment placement

Use repository-level Actions variables only for non-secret build-time values.

Use deployment provider secrets for runtime server secrets.

### Browser-safe variables

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_SUPABASE_LOGIN=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

### Server-side variables / secrets

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ALLOWED_INTAKE_ORIGINS=https://rosiedazzlers.ca,https://devilndove.com,https://devilndove.online
INTAKE_SHARED_SECRET=<secret only when endpoint testing begins>
```

## GitHub environments

Use these titles only when workflow environment gates are needed:

```text
preview
production
```

Do not use `main` as an environment name. `main` is the branch.

## No Supabase migration

QL-015 does not require a Supabase migration. No tables, RLS policies, or auth rules are changed.

## Non-goals

- Do not connect RosieDazzlers or DevilnDove live forms yet.
- Do not enable live intake persistence.
- Do not create public anonymous Supabase policies.
- Do not expose service-role keys, database URLs, JWT secrets, or shared secrets.
- Do not send customer replies.
- Do not enable phone/SMS.
- Do not enable AI auto-send.
- Do not store production customer records yet.

## Next build

QL-016 — Deployment Runtime Wrapper Selection.

Goal:

- Choose the actual runtime wrapper for the protected intake endpoint.
- Add the wrapper for Vercel or Cloudflare only after the deployment target is confirmed.
- Keep live intake disabled until dry-run tests and persistence review are complete.
