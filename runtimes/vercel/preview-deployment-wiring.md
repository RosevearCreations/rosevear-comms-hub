# Vercel Preview Deployment Wiring

QL-018 copies the protected intake wrapper pattern into the preview-capable route:

```text
api/intake.ts
```

The original template remains at:

```text
runtimes/vercel/api/intake.ts
```

## Safe default

The route remains disabled until `ENABLE_PROTECTED_INTAKE_ENDPOINT=true` is set server-side.

## First preview test expectation

The first preview deployment should prove that the route exists but remains disabled:

```text
POST /api/intake
→ 503 disabled
```

No website forms should be connected in QL-018.
