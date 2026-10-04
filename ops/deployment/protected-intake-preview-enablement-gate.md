# Protected Intake Preview Enablement Gate

QL-020 keeps the preview endpoint disabled until the enablement evidence is complete.

## Do not enable until all are true

```text
Preview URL is known
/api/intake returned HTTP 503 while disabled
mode was disabled
accepted was false
INTAKE_SHARED_SECRET is server-side only
ALLOWED_INTAKE_ORIGINS is configured
Rate limiting is approved
Idempotency is approved
Persistence is disabled
Public forms are disconnected
No service-role key is browser-exposed
```

## Current safe values

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
PROTECTED_INTAKE_ENABLEMENT_GATE_STATUS=hold
PROTECTED_INTAKE_ENABLEMENT_ALLOWED=false
```

## Stop conditions

Stop if a preview response is not disabled, if a secret appears in browser-facing settings, or if public forms are connected before dry-run validation is complete.
