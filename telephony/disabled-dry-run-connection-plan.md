# Disabled Dry-Run Connection Plan

Build: QL-027

## Provider-neutral path

QL-027 keeps the first phone/SMS path provider-neutral:

```text
provider portal review
→ no provider webhook configured
→ synthetic fixture only
→ disabled/dry-run route plan
→ no persistence writes
→ human review
```

## Provider candidates

- VoIP.ms
- Telnyx
- Twilio

## Safe planning labels

The repository may record:

- provider label
- target-use label
- test-number alias label
- capability label
- deployment-target label
- dry-run route label
- expected disabled HTTP status
- synthetic fixture planning confirmations
- redaction and safety confirmations

## Forbidden values

The repository must not record:

- actual purchased number
- candidate number
- provider tokens or API keys
- SIP credentials
- webhook secret values
- invoices or screenshots
- ownership documents
- live payloads
- customer data
- recordings or transcripts
- existing business or personal numbers

## Runtime status

Provider webhook configuration remains unset. Live webhooks, SMS sending, recording, AI drafts, AI auto-send, and customer-data access remain disabled.
