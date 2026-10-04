# Vercel Preview Enablement Gate

The Vercel preview route is `/api/intake`, but QL-020 keeps it disabled by default.

## First preview state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

## Enablement test state for a later build

A later build may temporarily test:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=true
ENABLE_INTAKE_PERSISTENCE=false
```

Only do that after disabled-mode evidence, secret placement, allowed origins, rate limiting, and idempotency are approved.

Do not connect RosieDazzlers or DevilnDove public forms during this gate.
