# Protected Intake Preview Deployment Wiring

QL-018 wires the preview-capable route without enabling it.

## Route

```text
/api/intake
```

## Expected safe response

With the default environment:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
```

The route should return:

```text
503 disabled
accepted: false
```

## Do not enable yet

Keep these values false until a later review build:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
```

## Server-only values

`INTAKE_SHARED_SECRET` must be stored only as a server-side deployment secret. It must not use a `VITE_` prefix.
