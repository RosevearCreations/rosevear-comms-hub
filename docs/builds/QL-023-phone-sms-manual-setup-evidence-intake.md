# QL-023 — Phone/SMS Test Number Manual Setup Evidence Intake

Status: complete.

## Summary

Added the manual setup evidence intake layer for the first phone/SMS test-number path.

The evidence intake is intentionally conservative: it accepts only non-secret manual setup facts and blocks purchase review until provider, target use, budget, account reference, storage location, portal review, number availability review, compliance review, and outside-repository evidence storage are confirmed.

## Added

```text
api/deployment/phoneSmsManualSetupEvidenceIntake.ts
api/contracts/phone-sms-manual-setup-evidence-intake.example.json
docs/36_PHONE_SMS_MANUAL_SETUP_EVIDENCE_INTAKE.md
ops/telephony/phone-sms-manual-setup-evidence-intake.md
telephony/manual-setup-evidence-intake.md
scripts/remote-operator-phone-sms-manual-setup-evidence-intake.md
```

## Updated

```text
README.md
.env.example
docs/08_BUILD_SEQUENCE.md
```

## Green criteria

- `main` contains the evidence intake helper and source-of-truth docs.
- `dev` is promoted to match `main`.
- Evidence status remains `blocked_pending_manual_evidence` until manual facts are supplied.
- Purchase review remains blocked.
- No provider credentials are committed.
- No ownership documents, invoices, screenshots, customer data, or existing phone numbers are committed.
- Existing numbers remain protected.
- Phone webhooks remain disabled.
- SMS remains disabled.
- Call recording remains disabled.
- AI auto-send remains disabled.

## Production state

```text
PHONE_SMS_MANUAL_SETUP_EVIDENCE_STATUS=blocked_pending_manual_evidence
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_TARGET_USE=undecided
PHONE_SMS_TEST_BUDGET_CAD_MONTHLY=
PHONE_SMS_TEST_ACCOUNT_CREATED=false
PHONE_SMS_TEST_ACCOUNT_REFERENCE_LABEL=
PHONE_SMS_CREDENTIAL_STORAGE_LOCATION=undecided
PHONE_SMS_PROVIDER_PORTAL_REVIEWED=false
PHONE_SMS_NUMBER_AVAILABILITY_REVIEWED=false
PHONE_SMS_SMS_COMPLIANCE_REVIEWED=false
PHONE_SMS_SETUP_EVIDENCE_STORED_OUTSIDE_REPOSITORY=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```
