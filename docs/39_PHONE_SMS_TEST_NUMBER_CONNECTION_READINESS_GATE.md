# 39 — Phone/SMS Test Number Connection Readiness Gate

Build: **QL-026 — Phone/SMS Test Number Connection Readiness Gate**

This document is the source of truth for reviewing whether the manually purchased disposable test number is ready for a **disabled/dry-run connection plan**.

QL-026 does **not** connect the provider, enable a webhook, send SMS, record calls, create AI drafts, or auto-send replies.

## Purpose

QL-026 confirms that the project has enough redacted, non-secret information to safely plan a later disabled/dry-run connection. It verifies that the actual purchased number, credentials, webhook secrets, purchase documents, customer data, and existing numbers remain outside the repository.

## Prerequisites

- QL-021 selected `new_test_number_first`.
- QL-022 setup gate was created.
- QL-023 manual setup evidence intake was created.
- QL-024 purchase review gate was created.
- QL-025 purchase evidence intake was created.
- Exactly one disposable test number may be represented only by a non-secret alias label.

## Accepted evidence

Only these values may be recorded in the repository:

- Provider label: `voipms`, `telnyx`, `twilio`, or `undecided`.
- Target-use label: `rosiedazzlers`, `devilndove`, `shared_hub`, or `undecided`.
- Purchased-number alias label without the number itself.
- Storage-location labels for the actual number, provider credentials, and future webhook secrets.
- Provider portal access confirmation.
- Provider connection-settings review confirmation.
- Disabled/dry-run route label without live payloads or secrets.
- Deployment target label.
- Connection mode label, which must remain `disabled_dry_run` for this build.
- Expected and actual capability labels.
- Voice/SMS dry-run scenario review confirmations.
- Allowed-origin, rate-limit, idempotency, logging-redaction, rollback, and operator-approval confirmations.

## Forbidden evidence

Do **not** commit:

- The actual candidate or purchased phone number.
- Provider API keys, client secrets, tokens, passwords, SIP credentials, webhook secrets, or live URLs containing secrets.
- Invoices, screenshots, receipts, phone-number ownership documents, or copied provider portal documents.
- Customer names, customer phone numbers, SMS content, call recordings, transcripts, or live phone/SMS payloads.
- Personal, Bell Fibe, RosieDazzlers, or DevilnDove existing numbers.
- Any instruction to enable live phone webhooks, SMS sending, call recording, AI drafts, or AI auto-send.

## Default environment state

```text
PHONE_SMS_CONNECTION_READINESS_STATUS=blocked_pending_connection_readiness
PHONE_SMS_PURCHASE_EVIDENCE_STATUS=blocked_pending_purchase_evidence
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_TARGET_USE=undecided
PHONE_SMS_PURCHASED_NUMBER_ALIAS_LABEL=
PHONE_SMS_PURCHASED_NUMBER_STORAGE_LOCATION=undecided
PHONE_SMS_CREDENTIAL_STORAGE_LOCATION=undecided
PHONE_SMS_WEBHOOK_SECRET_STORAGE_LOCATION=undecided
PHONE_SMS_CONNECTION_MODE=undecided
PHONE_SMS_CONNECTION_DEPLOYMENT_TARGET=undecided
PHONE_SMS_DRY_RUN_ROUTE_LABEL=
PHONE_SMS_ACTUAL_CAPABILITY=undecided
PHONE_SMS_PROVIDER_PORTAL_ACCESS_CONFIRMED=false
PHONE_SMS_PROVIDER_CONNECTION_SETTINGS_REVIEWED=false
PHONE_SMS_WEBHOOK_ENDPOINT_DRAFTED=false
PHONE_SMS_ALLOWED_ORIGINS_REVIEWED=false
PHONE_SMS_RATE_LIMIT_PLAN_REVIEWED=false
PHONE_SMS_IDEMPOTENCY_PLAN_REVIEWED=false
PHONE_SMS_LOGGING_REDACTION_PLAN_REVIEWED=false
PHONE_SMS_ROLLBACK_PLAN_REVIEWED=false
PHONE_SMS_OPERATOR_APPROVED_DRY_RUN_PLAN=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
TELEPHONY_PROVIDER=
TELEPHONY_WEBHOOK_SECRET=
SMS_WEBHOOK_SECRET=
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

## Production GREEN definition

QL-026 is GREEN when:

- The helper exists at `api/deployment/phoneSmsTestNumberConnectionReadinessGate.ts`.
- The fixture exists at `api/contracts/phone-sms-test-number-connection-readiness-gate.example.json`.
- This source-of-truth document exists.
- The connection readiness status is blocked by default.
- The actual purchased number is not present in repository text.
- Provider credentials, webhook secrets, SIP credentials, invoices, screenshots, ownership documents, customer data, live payloads, recordings, and transcripts are not present in repository text.
- Existing numbers remain unported and unforwarded.
- Phone webhooks, SMS sending, call recording, AI drafts, and AI auto-send remain disabled.
- No Supabase migration is added.
- No provider connection is activated.

## Next build

QL-027 — Phone/SMS Disabled Dry-Run Connection Plan.
