# Phone/SMS Manual Setup Evidence Intake — Ops Checklist

## Purpose

QL-023 records the non-secret evidence needed before reviewing a first manual test-number purchase.

## Keep out of repository

Do not put these in GitHub, docs, PRs, issues, screenshots, or chat:

```text
API keys
auth tokens
SIP usernames or passwords
webhook secrets
ownership documents
provider invoices
provider screenshots with private account details
customer phone numbers
SMS or call content
existing personal, Bell Fibe, RosieDazzlers, or DevilnDove numbers
```

## Allowed non-secret facts

```text
provider label: voipms, telnyx, or twilio
target use: rosiedazzlers, devilndove, or shared_hub
approved CAD monthly/pay-as-you-go budget
account created outside repository: true/false
non-secret account reference label
credential storage location label
portal reviewed: true/false
number availability reviewed: true/false
SMS/compliance reviewed: true/false
redacted setup notes
```

## Safe default flags

```text
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
```

## Manual setup evidence reminder

Evidence such as screenshots, invoices, ownership documents, provider account pages, or compliance forms must stay in a private storage location outside this repository.

Only a short redacted note should be recorded in the repository.
