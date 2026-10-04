# 33 — Protected Intake Preview Enablement Gate

## Build

QL-020 — Protected Intake Preview Enablement Gate.

## Result

QL-020 adds the gate that must pass before the preview-capable protected intake route can be enabled for dry-run testing.

This build does **not** enable the endpoint. It does **not** enable persistence. It does **not** connect RosieDazzlers or DevilnDove public website forms.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/deployment/protectedIntakePreviewEnablementGate.ts
api/contracts/protected-intake-preview-enablement-gate.example.json
docs/33_PROTECTED_INTAKE_PREVIEW_ENABLEMENT_GATE.md
docs/builds/QL-020-protected-intake-preview-enablement-gate.md
ops/deployment/protected-intake-preview-enablement-gate.md
runtimes/vercel/preview-enablement-gate.md
scripts/remote-operator-protected-intake-preview-enablement-gate.md
```

## Gate rule

The preview endpoint may only be enabled for dry-run testing after these conditions are confirmed:

```text
Preview URL exists
Disabled-mode response evidence is HTTP 503
Disabled-mode response body has mode: disabled
Disabled-mode response body has accepted: false
INTAKE_SHARED_SECRET is stored server-side only
ALLOWED_INTAKE_ORIGINS is configured server-side
Rate-limiting decision is approved
Idempotency decision is approved
ENABLE_INTAKE_PERSISTENCE remains false
Public website forms remain disconnected
No service-role key is exposed to browser code
```

## Safe current state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
PROTECTED_INTAKE_ENABLEMENT_GATE_STATUS=hold
PROTECTED_INTAKE_ENABLEMENT_ALLOWED=false
```

## What this gate allows later

After the gate passes, a later build may test:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=true
ENABLE_INTAKE_PERSISTENCE=false
```

That later test would still be dry-run only. It must not connect public forms or store customer records.

## Manual input required

No manual input is required to complete the QL-020 repository build.

Manual input will be required before any real preview enablement test:

```text
1. Provide or confirm the Vercel preview URL.
2. Confirm that /api/intake returns HTTP 503 while disabled.
3. Confirm INTAKE_SHARED_SECRET is stored only as a server-side secret.
4. Confirm ALLOWED_INTAKE_ORIGINS is set server-side.
5. Choose or approve the rate-limiting strategy.
6. Choose or approve the idempotency strategy.
7. Confirm public RosieDazzlers and DevilnDove forms are still disconnected.
```

## What must stay server-side only

```text
INTAKE_SHARED_SECRET
DATABASE_URL
DATABASE_READONLY_URL
service-role key
sb_secret_...
JWT secret
connection string
```

## Production GREEN definition

For QL-020, production GREEN means:

```text
main contains the preview enablement gate helper and docs
/api/intake remains disabled by default
persistence is disabled
no public website form is connected
no customer data is written
no Supabase migration is required
```

## Non-goals

- Do not enable the endpoint yet.
- Do not enable persistence yet.
- Do not connect RosieDazzlers or DevilnDove forms yet.
- Do not write customer records.
- Do not expose service-role keys, database URLs, JWT secrets, or shared secrets.
- Do not enable public anonymous Supabase write policies.
- Do not enable phone/SMS.
- Do not enable AI auto-send.

## Next build

QL-021 — Phone/SMS Provider Test Decision.

Goal:

- Choose the safest test-number approach without risking current phone numbers.
- Compare VoIP.ms, Telnyx, Twilio, FreePBX/Asterisk, and 3CX against the actual workflow.
- Keep existing business numbers unported and unforwarded until a test path is proven.
