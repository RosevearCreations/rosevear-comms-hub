# 29 — Deployment Runtime Wrapper Selection

## Build

QL-016 — Deployment Runtime Wrapper Selection.

## Decision

The first protected-intake runtime wrapper target is:

```text
vercel_serverless_function
```

The wrapper template is stored at:

```text
runtimes/vercel/api/intake.ts
```

It is intentionally stored under `runtimes/`, not the live root `api/` route path. This prevents it from becoming a public endpoint before the deployment target, secrets, origin allowlist, rate limit, and dry-run plan are reviewed.

## Why this target was selected first

For this repo, the Vercel wrapper is the lowest-friction first draft because:

- the admin shell is already a Vite web app;
- the protected intake handler is TypeScript and server-side friendly;
- the wrapper can remain a template until a deployment target is confirmed;
- it does not require connecting phone/SMS, changing Supabase policies, or moving any real customer data.

This is not a permanent lock-in. The provider-neutral endpoint and persistence adapter remain the source of truth.

## Safe current state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
DEPLOYMENT_TARGET=vercel
DEPLOYMENT_RUNTIME_WRAPPER=vercel_serverless_function
```

## Not live yet

QL-016 does not deploy the endpoint.

QL-016 does not move the wrapper into the live root route.

QL-016 does not connect RosieDazzlers or DevilnDove forms.

QL-016 does not add anonymous Supabase table access.

QL-016 does not store production customer records.

## Wrapper behavior

The Vercel wrapper template is a thin adapter around the existing protected endpoint handler:

```text
HTTP request
→ normalize method, headers, and body
→ call handleProtectedWebsiteIntake(...)
→ return JSON response
```

The actual security logic remains in:

```text
api/endpoints/protectedIntakeEndpoint.ts
```

The persistence mapping remains in:

```text
api/persistence/intakePersistenceAdapter.ts
```

## Required before moving the wrapper live

Before any file is copied or routed into a real deployment endpoint, confirm:

```text
Deployment provider selected and connected
Preview URL exists
Production URL exists or is intentionally deferred
INTAKE_SHARED_SECRET is stored as a server-side secret
ALLOWED_INTAKE_ORIGINS is set
ENABLE_PROTECTED_INTAKE_ENDPOINT remains false for first deployment
ENABLE_INTAKE_PERSISTENCE remains false
Rate limiting strategy is selected
Idempotency strategy is selected
Dry-run test payload is approved
No service-role key is exposed to the browser
No anonymous Supabase write policies are added
```

## Remote operator setup note

No new outside setup is required for QL-016.

A later build will require a deployment provider connection for preview testing. At that point, use the repository variables and secrets already defined for this project and keep server-side secrets out of Vite/browser variables.

## Production GREEN definition

For QL-016, production GREEN means:

```text
main contains the runtime selection docs and template
protected intake remains disabled
persistence remains disabled
no public website form is connected
no customer data is written
no Supabase migration is required
```

## Next build

QL-017 — Protected Intake Dry-Run Runtime Verification.
