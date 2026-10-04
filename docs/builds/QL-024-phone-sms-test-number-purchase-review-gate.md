# QL-024 — Phone/SMS Test Number Purchase Review Gate

## Status

Complete when merged to `dev`, promoted to `main`, and app CI is GREEN.

## Purpose

Create a safe purchase-review gate before buying one new disposable Canadian phone/SMS test number manually outside the repository.

## Scope

- Add provider-neutral purchase-review helper.
- Add a contract fixture with default blocked state.
- Document all manual review requirements.
- Keep real provider material and real phone-number material outside the repository.
- Keep all phone/SMS runtime features disabled.

## Files

```text
api/deployment/phoneSmsTestNumberPurchaseReviewGate.ts
api/contracts/phone-sms-test-number-purchase-review-gate.example.json
docs/37_PHONE_SMS_TEST_NUMBER_PURCHASE_REVIEW_GATE.md
docs/builds/QL-024-phone-sms-test-number-purchase-review-gate.md
ops/telephony/phone-sms-test-number-purchase-review-gate.md
telephony/test-number-purchase-review-gate.md
scripts/remote-operator-phone-sms-test-number-purchase-review-gate.md
README.md
.env.example
docs/08_BUILD_SEQUENCE.md
```

## Review gate

The gate remains blocked until these non-secret confirmations are complete:

```text
manual setup evidence complete
provider chosen
target use chosen
budget approved
account exists outside repository
account reference label recorded without secrets
credential storage location recorded without values
provider portal reviewed
Canadian number availability reviewed
SMS/compliance reviewed
external evidence storage confirmed
candidate number region/type label recorded without the actual number
capability confirmed
estimated monthly/setup costs recorded
owner approval recorded
safety locks remain active
```

## Safety locks

```text
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

## Not included

- No provider connection.
- No provider credentials.
- No actual phone number.
- No number purchase by code.
- No screenshots, invoices, ownership proof, or customer data.
- No Supabase migration.
- No live webhook or SMS activation.

## GREEN definition

```text
helper and docs are present
fixture defaults to blocked
manual purchase is allowed only after all blockers pass
repository contains no sensitive provider or number evidence
CI passes on PR and on main
main equals promoted GREEN build
```
