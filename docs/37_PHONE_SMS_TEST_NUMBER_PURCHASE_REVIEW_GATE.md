# 37 — Phone/SMS Test Number Purchase Review Gate

## Build

QL-024 — Phone/SMS Test Number Purchase Review Gate.

## Result

QL-024 adds the purchase-review gate for the first phone/SMS test-number path.

This build does **not** buy a phone number. It does **not** store the actual candidate or purchased number. It does **not** store provider credentials, SIP credentials, webhook secrets, invoices, screenshots, or ownership documents. It does **not** port or forward existing numbers. It does **not** enable phone webhooks, SMS sending, call recording, or AI auto-send.

The gate answers one narrow question:

```text
Is it safe for the owner to manually purchase one new disposable Canadian test number outside the repository?
```

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/deployment/phoneSmsTestNumberPurchaseReviewGate.ts
api/contracts/phone-sms-test-number-purchase-review-gate.example.json
docs/37_PHONE_SMS_TEST_NUMBER_PURCHASE_REVIEW_GATE.md
docs/builds/QL-024-phone-sms-test-number-purchase-review-gate.md
ops/telephony/phone-sms-test-number-purchase-review-gate.md
telephony/test-number-purchase-review-gate.md
scripts/remote-operator-phone-sms-test-number-purchase-review-gate.md
```

## Gate decision

The first phone/SMS experiment path remains:

```text
new test number first
```

QL-024 may allow exactly one manual purchase only after all purchase-review blockers are resolved.

Allowed first-provider candidates remain:

```text
VoIP.ms
Telnyx
Twilio
```

The first test number must remain:

```text
Canadian
new/disposable
not ported
not forwarded from any existing number
not connected to live customer data
not connected to live phone/SMS webhooks yet
```

## Default purchase-review state

```text
PHONE_SMS_PURCHASE_REVIEW_GATE_STATUS=blocked_pending_purchase_review
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
PHONE_SMS_CANDIDATE_NUMBER_REGION_LABEL=
PHONE_SMS_EXPECTED_CAPABILITY=undecided
PHONE_SMS_ESTIMATED_MONTHLY_COST_CAD=
PHONE_SMS_ESTIMATED_SETUP_COST_CAD=
PHONE_SMS_PURCHASE_APPROVED_BY_OWNER=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

## Purchase-review blockers

QL-024 remains blocked until all of these are true:

```text
QL-023 non-secret manual setup evidence is complete
one provider is chosen: voipms, telnyx, or twilio
first target use is chosen: RosieDazzlers, DevilnDove, or shared hub testing
CAD monthly/pay-as-you-go budget is approved
provider account exists outside the repository
non-secret account reference label is recorded
credential storage location is recorded without credential values
provider portal purchase screen is reviewed
Canadian test-number availability is reviewed
SMS/compliance requirements are reviewed
screenshots, invoices, ownership proof, and provider docs are stored outside the repository
only a region/type label is recorded for candidate number, not the actual number
expected capability is confirmed: voice_only, sms_capable, or voice_and_sms
estimated monthly cost is recorded and does not exceed approved budget
estimated setup cost is recorded
owner approval is recorded
existing numbers remain protected
phone/SMS webhooks, SMS sending, call recording, and AI auto-send remain disabled
```

## Allowed after approval

After the QL-024 gate passes, the owner may manually purchase exactly one new disposable Canadian test number in the chosen provider portal.

After purchase, the repository still must not contain:

```text
actual purchased phone number
provider API keys
tokens
passwords
SIP credentials
webhook secrets
screenshots
invoices
ownership documents
customer data
personal numbers
existing RosieDazzlers or DevilnDove numbers
```

The next build records only redacted, non-secret purchase evidence.

## Production GREEN definition

For QL-024, production GREEN means:

```text
main contains the purchase-review gate helper and docs
purchase review defaults to blocked
manual purchase is allowed only when every review and safety condition passes
no provider credentials are committed
no actual candidate or purchased number is committed
no screenshots, invoices, ownership documents, or customer data are committed
existing numbers remain unported and unforwarded
phone webhooks remain disabled
SMS remains disabled
call recording remains disabled
AI auto-send remains disabled
no Supabase migration is added
no provider account is connected by code
no number is purchased by code
```

## Non-goals

- Do not buy a phone number in repository code.
- Do not commit the actual phone number.
- Do not port any number.
- Do not forward any existing number.
- Do not enable phone/SMS webhooks.
- Do not enable SMS sending.
- Do not enable call recording.
- Do not auto-send AI replies.
- Do not connect live website forms or real customer data.
- Do not commit provider tokens, API keys, SIP credentials, webhook secrets, ownership documents, invoices, screenshots, customer data, or existing phone numbers.

## Next build

QL-025 — Phone/SMS Test Number Purchase Evidence Intake.

Goal:

- Record only redacted, non-secret evidence that one new test number was purchased manually.
- Keep the actual number and all ownership documents outside the repository.
- Keep phone webhooks, SMS sending, call recording, and AI auto-send disabled.
