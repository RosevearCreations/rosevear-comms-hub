# Phone/SMS Test Number Connection Readiness Gate — Ops Checklist

Build: QL-026

## Safe checks

- [ ] QL-025 redacted purchase evidence is complete.
- [ ] Provider label is selected without credentials.
- [ ] Purchased-number alias label is present without the actual number.
- [ ] Actual number storage location is outside the repository.
- [ ] Provider credential storage location is outside the repository.
- [ ] Future webhook secret storage location is outside the repository.
- [ ] Provider portal access is confirmed without copied screenshots or documents.
- [ ] Provider connection settings are reviewed without enabling them.
- [ ] Disabled/dry-run route label is drafted without live payloads or secrets.
- [ ] Allowed origins, rate limits, idempotency, logging redaction, and rollback plan are reviewed.
- [ ] Operator approval is recorded before QL-027 planning.

## Must remain false

```text
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_DRAFTS=false
ENABLE_AI_AUTO_SEND=false
```

## Never commit

- Actual phone numbers.
- API keys, tokens, passwords, SIP credentials, or webhook secrets.
- Invoices, receipts, screenshots, or ownership documents.
- Customer data, SMS content, live payloads, recordings, or transcripts.
- Existing personal, Bell Fibe, RosieDazzlers, or DevilnDove numbers.
