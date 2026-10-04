# 36 — Phone/SMS Test Number Manual Setup Evidence Intake

## Build

QL-023 — Phone/SMS Test Number Manual Setup Evidence Intake.

## Result

QL-023 adds a safe evidence-intake layer for the first manual provider-account setup step.

This build does **not** choose a provider for the operator. It does **not** create a provider account. It does **not** buy a number. It does **not** store provider credentials, SIP credentials, webhook secrets, ownership documents, invoices, screenshots, customer data, or existing phone numbers.

The build records the shape of the evidence that can be safely entered later:

```text
selected provider label
first target use
approved CAD test budget
provider account created yes/no
non-secret account reference label
credential storage location label
portal reviewed yes/no
number availability reviewed yes/no
SMS/compliance reviewed yes/no
plain-language redacted setup notes
```

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/deployment/phoneSmsManualSetupEvidenceIntake.ts
api/contracts/phone-sms-manual-setup-evidence-intake.example.json
docs/36_PHONE_SMS_MANUAL_SETUP_EVIDENCE_INTAKE.md
docs/builds/QL-023-phone-sms-manual-setup-evidence-intake.md
ops/telephony/phone-sms-manual-setup-evidence-intake.md
telephony/manual-setup-evidence-intake.md
scripts/remote-operator-phone-sms-manual-setup-evidence-intake.md
```

## Accepted evidence

The repository may only receive non-secret setup evidence:

```text
selected provider: voipms, telnyx, or twilio
target use: rosiedazzlers, devilndove, or shared_hub
approved CAD monthly/pay-as-you-go budget as a number only
account created outside repository: true/false
non-secret account reference label
credential storage location label: password_manager or deployment_secret_store
provider portal reviewed: true/false
Canadian number availability reviewed: true/false
SMS/compliance reviewed: true/false
redacted setup notes with no credentials or customer data
```

## Forbidden evidence

Do not place these in GitHub, docs, PRs, comments, screenshots, or chat:

```text
provider API keys
auth tokens
client secrets
SIP usernames or passwords
trunk credentials
webhook secrets or signing secrets
phone-number ownership documents
provider invoices
provider screenshots that reveal private account details
customer names, phone numbers, SMS text, call recordings, or transcripts
personal phone numbers
Bell Fibe numbers
existing RosieDazzlers or DevilnDove numbers
```

## Default evidence state

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

## Production GREEN definition

For QL-023, production GREEN means:

```text
main contains the manual setup evidence intake helper and docs
manual evidence remains blocked until non-secret facts are entered
purchase review remains blocked until evidence is complete
no provider credentials are committed
no ownership documents, invoices, screenshots, customer data, or existing phone numbers are committed
no phone number is purchased by code
existing numbers remain unported and unforwarded
phone webhooks remain disabled
SMS remains disabled
call recording remains disabled
AI auto-send remains disabled
```

## Non-goals

- Do not select a provider automatically.
- Do not create or connect a provider account.
- Do not buy a number.
- Do not port any number.
- Do not forward any existing number.
- Do not enable phone/SMS webhooks.
- Do not enable SMS.
- Do not enable call recording.
- Do not auto-send AI replies.
- Do not enter real production customer data.
- Do not commit provider tokens, API keys, SIP credentials, webhook secrets, or phone-number ownership documents.

## Next build

QL-024 — Phone/SMS Test Number Purchase Review Gate.

Goal:

- Review the non-secret manual setup evidence.
- Confirm provider, target use, budget, storage location, and compliance review.
- Decide whether one new test number can be purchased manually without enabling live webhooks.
