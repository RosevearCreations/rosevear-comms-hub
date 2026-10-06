# 39 — Phone/SMS Disabled Dry-Run Connection Plan

Build: **QL-027 — Phone/SMS Disabled Dry-Run Connection Plan**

## Purpose

QL-027 plans the first provider-neutral disabled/dry-run connection path for the manually purchased disposable test number.

This build does **not** connect the provider, does **not** configure a provider webhook, does **not** expose the actual purchased number, and does **not** process live phone/SMS payloads.

The safe target remains:

```text
new test number
→ synthetic inbound call/SMS fixture
→ disabled/dry-run mapping review
→ no persistence writes
→ human review
→ no auto-send
```

## Required prior gate

QL-026 must be complete before QL-027 is allowed.

QL-027 remains blocked until the connection-readiness gate says the manually purchased disposable test number is ready for disabled/dry-run planning.

## Accepted evidence

QL-027 may record only non-secret planning labels and boolean confirmations:

- Provider label: `voipms`, `telnyx`, or `twilio`.
- Target use label: `rosiedazzlers`, `devilndove`, or `shared_hub`.
- Purchased-number alias label, without the number itself.
- Actual capability label: `voice_only`, `sms_capable`, or `voice_and_sms`.
- Deployment target label.
- Disabled/dry-run route label.
- Expected disabled response: `HTTP 503`.
- Provider portal reviewed but webhook left unconfigured.
- Webhook secret name planned, not value.
- Synthetic voice/SMS fixture planning confirmations.
- Contact/conversation/task mapping confirmation using synthetic data only.
- Persistence disabled, live customer reads disabled, and live customer writes disabled.
- Rate-limit, idempotency, replay-protection, logging-redaction, rollback, and operator approval confirmations.

## Forbidden evidence

Do not commit or paste:

- Actual candidate or purchased phone number.
- Provider API keys, tokens, client secrets, passwords, SIP credentials, or webhook secret values.
- Invoices, screenshots, receipts, number ownership documents, or copied provider portal documents.
- Customer names, customer phone numbers, SMS content, call recordings, transcripts, or live phone/SMS payloads.
- Personal, Bell Fibe, RosieDazzlers, or DevilnDove existing numbers.
- A live provider callback URL containing secrets.
- Any instruction that enables provider webhooks, live phone webhooks, SMS sending, call recording, AI drafts, AI auto-send, live customer reads, or live customer writes.

## Safe default environment state

```text
PHONE_SMS_DISABLED_DRY_RUN_PLAN_STATUS=blocked_pending_disabled_dry_run_plan
PHONE_SMS_CONNECTION_READINESS_STATUS=blocked_pending_connection_readiness
PHONE_SMS_DRY_RUN_DEPLOYMENT_TARGET=undecided
PHONE_SMS_DRY_RUN_CONNECTION_MODE=undecided
PHONE_SMS_DRY_RUN_ENDPOINT_MODE=undecided
PHONE_SMS_DRY_RUN_EXPECTED_DISABLED_STATUS=503
PHONE_SMS_DRY_RUN_ROUTE_LABEL=
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
PHONE_SMS_DRY_RUN_PERSISTENCE_MODE=undecided
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

## Production GREEN definition

Production is GREEN for QL-027 only when:

- The helper and fixture exist on `main`.
- README, `.env.example`, and the build sequence name QL-027 as the current completed build.
- The disabled/dry-run plan defaults to blocked.
- No actual purchased number, credentials, webhook secret values, invoices, screenshots, ownership documents, customer data, live payloads, recordings, transcripts, or existing numbers are committed.
- Provider webhooks remain unconfigured.
- Live phone webhooks, SMS sending, call recording, AI drafts, AI auto-send, live customer reads, and live customer writes remain disabled.
- Existing numbers remain unported and unforwarded.
- No Supabase migration is added.
- No provider account is connected.
- No provider callback route is live-enabled.
- GitHub Actions app CI passes on the PR and on `main`.

## Next build

QL-028 — Phone/SMS Disabled Dry-Run Runtime Verification.
