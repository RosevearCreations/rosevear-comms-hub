# QL-025 — Phone/SMS Test Number Purchase Evidence Intake

## Purpose

QL-025 records only redacted, non-secret evidence that one new disposable phone/SMS test number was manually purchased outside the repository after QL-024 purchase review.

This build does **not** purchase a number through code, does **not** store the actual purchased number, does **not** store provider documents, and does **not** enable live phone/SMS behavior.

## Source files

- `api/deployment/phoneSmsTestNumberPurchaseEvidenceIntake.ts`
- `api/contracts/phone-sms-test-number-purchase-evidence-intake.example.json`
- `docs/builds/QL-025-phone-sms-test-number-purchase-evidence-intake.md`
- `ops/telephony/phone-sms-test-number-purchase-evidence-intake.md`
- `telephony/test-number-purchase-evidence-intake.md`
- `scripts/remote-operator-phone-sms-test-number-purchase-evidence-intake.md`

## Required non-secret evidence

Record only these non-secret labels and confirmations:

- Provider label: `voipms`, `telnyx`, or `twilio`.
- Target use: `rosiedazzlers`, `devilndove`, or `shared_hub`.
- Approved CAD budget and actual CAD costs as numbers only.
- Non-secret account reference label.
- Non-secret purchase reference label that is not an invoice number.
- Non-secret alias for the purchased test number without the phone number itself.
- Storage location label for the actual purchased number.
- Storage location label for invoices/screenshots/ownership documents.
- Region/type labels for candidate and purchased number without the actual number.
- Capability label: `voice_only`, `sms_capable`, or `voice_and_sms`.
- Boolean confirmations that no forbidden evidence is committed.

## Forbidden evidence

Never commit:

- Actual candidate or purchased phone number.
- Provider API keys, tokens, passwords, SIP credentials, webhook secrets, or client secrets.
- Invoices, screenshots, receipts, ownership documents, or copied provider portal details.
- Customer names, phone numbers, SMS content, call recordings, transcripts, or live payloads.
- Personal, Bell Fibe, RosieDazzlers, or DevilnDove existing numbers.
- Instructions or switches that enable phone webhooks, SMS sending, call recording, or AI auto-send.

## Safety gates

QL-025 remains blocked until:

1. QL-024 purchase review is approved.
2. One test number was manually purchased outside repository code.
3. The actual number is stored outside the repository.
4. Purchase documents are stored outside the repository.
5. No actual or phone-like numbers appear in repository labels or notes.
6. Existing numbers remain protected.
7. Porting and forwarding remain disabled.
8. Phone webhooks, SMS sending, call recording, and AI auto-send remain disabled.

## Current default state

```text
PHONE_SMS_PURCHASE_EVIDENCE_STATUS=blocked_pending_purchase_evidence
PHONE_SMS_PURCHASE_COMPLETED_OUTSIDE_REPOSITORY=false
PHONE_SMS_PURCHASE_REFERENCE_LABEL=
PHONE_SMS_PURCHASED_NUMBER_ALIAS_LABEL=
PHONE_SMS_PURCHASED_NUMBER_STORAGE_LOCATION=undecided
PHONE_SMS_PURCHASE_DOCUMENT_STORAGE_LOCATION=undecided
PHONE_SMS_ACTUAL_NUMBER_REGION_LABEL=
PHONE_SMS_ACTUAL_CAPABILITY=undecided
PHONE_SMS_MONTHLY_COST_CAD=
PHONE_SMS_SETUP_COST_CAD=
PHONE_SMS_TEST_NUMBER_PURCHASED=false
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

## GREEN definition

QL-025 is GREEN when:

- The helper and fixture exist.
- Source-of-truth, build, ops, telephony, and remote-operator docs exist.
- The default state is blocked and production-safe.
- The repository contains no actual phone numbers or provider secrets.
- Existing numbers remain protected.
- No live phone/SMS feature is enabled.

## Next build

QL-026 — Phone/SMS Test Number Connection Readiness Gate.
