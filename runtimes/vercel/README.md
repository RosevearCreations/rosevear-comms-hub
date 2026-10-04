# Vercel Runtime Wrapper Template

QL-016 selects the Vercel serverless function wrapper as the first protected-intake runtime path.

## Important boundary

The wrapper is a template only:

```text
runtimes/vercel/api/intake.ts
```

Do not move or copy it to a live deployment route until QL-017 confirms preview deployment, secret placement, origin allowlist, and dry-run behavior.

## Safe defaults

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
```

## Planned live route later

When reviewed in a later build, the wrapper may become:

```text
api/intake.ts
```

That move must be paired with a preview-only dry-run test first. Production must stay disabled until the endpoint responds correctly and no public anonymous Supabase access is introduced.

## Secret rule

`INTAKE_SHARED_SECRET` must be a server-side secret only.

Never prefix it with `VITE_`.

Never put a service-role key, database URL, JWT secret, or database password in browser variables.
