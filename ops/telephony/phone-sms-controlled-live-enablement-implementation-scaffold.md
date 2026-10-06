# Phone/SMS Controlled Live Enablement Implementation Scaffold — Ops Checklist

## Build

```text
QL-036 — Phone/SMS Controlled Live Enablement Implementation Scaffold
```

## Operator rule

Do not enable live traffic during QL-036.

## Required prior confirmations

- QL-034 explicit live enablement decision gate approved controlled planning only.
- QL-035 controlled live enablement plan is ready for manual implementation design only.
- Existing numbers remain protected.
- Provider account remains disconnected from production callbacks.
- No actual test number, provider credential, webhook secret value, customer data, recording, transcript, invoice, screenshot, ownership document, or live payload is committed.

## Scaffold surfaces to confirm

- Provider callback route stub exists only as disabled planning shape.
- Phone webhook route stub returns disabled behavior by default.
- SMS send adapter is a no-send placeholder.
- Call recording adapter is unavailable.
- AI draft adapter is disabled.
- AI auto-send guard blocks every path.
- Persistence adapter keeps writes disabled.
- Live customer access guard keeps reads and writes disabled.
- Operator console gate requires a later manual go/no-go.
- Audit log stub stores no evidence or live payloads.
- Rollback switch can force disabled state.

## Environment locks

Keep these values disabled:

```text
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
```

## Block release if any are true

- Provider callback enabled.
- Phone webhook enabled.
- SMS sending enabled.
- Call recording enabled.
- AI draft or AI auto-send enabled.
- Persistence writes enabled.
- Live customer reads or writes enabled.
- Any actual phone number appears in repository files.
- Any provider secret or webhook secret value appears in repository files.
- Any customer data, live provider payload, recording, or transcript appears in repository files.

## Production proof

Production GREEN requires:

```text
PR to dev CI GREEN
PR dev to main CI GREEN
final main push CI GREEN
```
