# QL-029 — Phone/SMS Disabled Dry-Run Evidence Mapping Review

Status: complete when merged to `dev`, promoted to `main`, and `main` CI is GREEN.

## Scope

QL-029 adds a provider-neutral evidence mapping review for synthetic disabled/dry-run phone/SMS evidence.

The build maps synthetic voice/SMS fixtures into preview-only contact, conversation, and human-review task shapes.

## Files

- `api/deployment/phoneSmsDisabledDryRunEvidenceMappingReview.ts`
- `api/contracts/phone-sms-disabled-dry-run-evidence-mapping-review.example.json`
- `docs/42_PHONE_SMS_DISABLED_DRY_RUN_EVIDENCE_MAPPING_REVIEW.md`
- `docs/builds/QL-029-phone-sms-disabled-dry-run-evidence-mapping-review.md`
- `ops/telephony/phone-sms-disabled-dry-run-evidence-mapping-review.md`
- `telephony/disabled-dry-run-evidence-mapping-review.md`
- `scripts/remote-operator-phone-sms-disabled-dry-run-evidence-mapping-review.md`

## Safety locks

```text
PHONE_SMS_EVIDENCE_MAPPING_SYNTHETIC_ONLY=true
PHONE_SMS_EVIDENCE_MAPPING_NO_PERSISTENCE_WRITES=true
PHONE_SMS_EVIDENCE_MAPPING_LIVE_CUSTOMER_ACCESS_DISABLED=true
PHONE_SMS_PROVIDER_WEBHOOK_CONFIGURED=false
PHONE_SMS_PERSISTENCE_WRITES_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_READS_DISABLED=true
PHONE_SMS_LIVE_CUSTOMER_WRITES_DISABLED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

## Not included

- No actual phone number.
- No provider credentials or SIP credentials.
- No webhook secret values.
- No invoices, screenshots, receipts, or ownership documents.
- No customer data.
- No live phone/SMS payloads.
- No call recordings or transcripts.
- No provider webhook configuration.
- No persistence writes.
- No Supabase migration.
- No live provider connection.

## GREEN proof

- PR CI passes `npm install`, `npm run check`, and `npm run build`.
- `main` CI passes the same checks after promotion.

## Next

QL-030 — Phone/SMS Disabled Dry-Run Human Review Gate.
