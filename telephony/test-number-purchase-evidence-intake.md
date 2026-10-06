# Telephony Note — Test Number Purchase Evidence Intake

QL-025 is not a connection build. It only records safe evidence that one test number was manually purchased.

## What may be recorded

- Provider label.
- Target use.
- Cost numbers in CAD.
- Region/type labels.
- Capability labels.
- External storage location labels.
- Redaction and safety confirmations.

## What must stay outside this repository

- The purchased phone number.
- Candidate phone numbers.
- Provider portal screenshots.
- Invoices, receipts, and ownership documents.
- Provider credentials, SIP credentials, tokens, passwords, and webhook secrets.
- Customer data, call recordings, transcripts, SMS content, or live payloads.

## Feature state after QL-025

```text
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

The purchased test number must remain disconnected from live automation until a later connection readiness gate is complete.
