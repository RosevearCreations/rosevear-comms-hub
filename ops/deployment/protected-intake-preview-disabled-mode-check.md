# Protected Intake Preview Disabled-Mode Check

## Purpose

QL-019 confirms that the preview-capable `/api/intake` route stays safely disabled until explicit enablement.

## Expected result

```text
POST /api/intake
HTTP 503
mode: disabled
accepted: false
```

## Safe variables

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
```

## Stop conditions

Stop and do not enable the endpoint if:

- `/api/intake` returns `dry_run` while `ENABLE_PROTECTED_INTAKE_ENDPOINT=false`;
- `/api/intake` returns `accepted: true` while disabled;
- the shared secret is present in a browser-facing `VITE_` variable;
- a Supabase service-role key appears in frontend code or client env;
- any public website form is connected before dry-run review.
