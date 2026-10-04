# Protected Intake Dry-Run Runtime Verification

## Purpose

This checklist confirms the protected intake runtime can be verified in dry-run mode before any live website form is connected.

## Contract-level checks

Expected states:

```text
1. disabled_gate returns 503 disabled and accepted=false.
2. invalid_secret returns 401 rejected and accepted=false.
3. valid_dry_run returns 202 dry_run and accepted=true.
```

## Safe environment state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
```

## Do not proceed to live preview until

```text
INTAKE_SHARED_SECRET is stored as a server-side secret
ALLOWED_INTAKE_ORIGINS is reviewed
Preview deployment URL exists
Rate limiting plan is selected
Idempotency plan is selected
Persistence stays disabled
No service-role key is exposed to browser variables
```

## Stop conditions

Stop if any of these appear:

```text
VITE_INTAKE_SHARED_SECRET
VITE_DATABASE_URL
VITE_SERVICE_ROLE_KEY
anonymous Supabase write policy
ENABLE_INTAKE_PERSISTENCE=true
```
