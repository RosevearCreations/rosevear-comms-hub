# Vercel Runtime Wrapper Selection

## Build

QL-016 — Deployment Runtime Wrapper Selection.

## Selected target

```text
vercel_serverless_function
```

## Template path

```text
runtimes/vercel/api/intake.ts
```

## Planned live path later

```text
api/intake.ts
```

Do not create the live path until QL-017 preview verification.

## Required settings later

Server-side variables/secrets for preview deployment:

```text
DEPLOYMENT_TARGET=vercel
DEPLOYMENT_RUNTIME_WRAPPER=vercel_serverless_function
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
ALLOWED_INTAKE_ORIGINS=https://rosiedazzlers.ca,https://devilndove.com,https://devilndove.online
INTAKE_SHARED_SECRET=<server-side secret only>
```

## Do not expose

```text
service-role key
database password
DATABASE_URL
JWT secret
INTAKE_SHARED_SECRET in browser variables
```

## GREEN state for QL-016

```text
wrapper selected
wrapper template stored outside live route
endpoint disabled
persistence disabled
no anonymous Supabase policies
no live public website forms
```
