# Phone/SMS Controlled Live Enablement Disabled Verification — Ops Checklist

## Build

```text
QL-037 — Phone/SMS Controlled Live Enablement Disabled Verification
```

## Pre-checks

- Confirm QL-034 approved controlled live enablement planning.
- Confirm QL-035 plan is ready for manual implementation design.
- Confirm QL-036 scaffold is ready for disabled verification.
- Confirm all evidence labels are synthetic and redacted.
- Confirm no actual phone numbers, credentials, webhook secret values, customer data, live payloads, recordings, or transcripts are present.

## Surfaces to verify disabled

```text
provider callback route
phone webhook route
SMS send adapter
call recording adapter
AI draft adapter
AI auto-send guard
persistence adapter
live customer access guard
operator console gate
audit log stub
rollback switch
```

## Required disabled states

- Provider callbacks disabled.
- Phone webhooks disabled.
- SMS sending disabled.
- Call recording disabled.
- AI drafts disabled.
- AI auto-send disabled.
- Persistence writes disabled.
- Live customer reads disabled.
- Live customer writes disabled.
- Existing numbers protected.

## Stop conditions

Stop the build and do not promote if any of these appear:

- A provider webhook is configured.
- Any live callback or webhook path is enabled.
- SMS sending is enabled.
- Call recording is enabled.
- AI draft or auto-send is enabled.
- Persistence writes are enabled.
- Live customer reads or writes are enabled.
- A required scaffold surface is missing.
- Evidence contains real provider, customer, call, SMS, credential, recording, transcript, invoice, screenshot, or ownership information.

## Promotion rule

Promote only after:

1. Feature PR CI passes.
2. The feature branch merges to `dev`.
3. The exact `dev` tree is promoted to `main`.
4. The final `main` push CI passes.

## Next queued build

```text
QL-038 — Phone/SMS Controlled Live Enablement Manual Go/No-Go Gate
```
