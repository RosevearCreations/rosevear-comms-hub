# Protected Intake Readiness Gate

## Purpose

This gate prevents RosieDazzlers or DevilnDove public website forms from writing customer data before the protected endpoint is deployed safely.

## Current decision

Do not enable live intake yet.

The code may exist in the repository, but production readiness requires a named runtime, server-only secret storage, dry-run testing, rate limiting, idempotency, and admin-review behavior.

## Required runtime decision

Pick one runtime before enabling the endpoint:

- Vercel serverless function, if the hub app is deployed on Vercel.
- Cloudflare Pages Function, if the hub app is deployed on Cloudflare Pages.
- A small API service, only if we later need persistent backend processes.

## Default release posture

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

## Required server-only secret

```text
INTAKE_SHARED_SECRET
```

This value must be stored only in the deployment provider's server-side secret system. It must not be committed, pasted into chat, prefixed with `VITE_`, or exposed to browser JavaScript.

## Approved production origins draft

```text
https://rosiedazzlers.ca
https://devilndove.com
https://devilndove.online
```

## Release hold reasons

Hold release if any of these are true:

- Secret is stored as a public/frontend variable.
- Endpoint can be called without the shared secret.
- Endpoint accepts unexpected origins.
- Endpoint writes duplicate submissions without idempotency.
- Logs expose secrets or excessive customer details.
- Website can bypass the server-side endpoint and write directly to Supabase.
- Admin review is not required before a customer reply.
