# Ops Checklist — Phone/SMS Test Number Purchase Evidence Intake

## Operator rules

- Do not paste the purchased phone number into GitHub, docs, chat, or `.env.example`.
- Do not paste provider API keys, SIP credentials, webhook secrets, invoices, screenshots, receipts, or ownership documents.
- Store the actual number and purchase documents only in the approved external secure location.
- Use labels such as `provider test number 001` or `Canadian local test number`, not the number itself.

## Required confirmations

- QL-024 purchase review was approved.
- The number was purchased manually outside repository code.
- The number is stored outside the repository.
- Purchase documents are stored outside the repository.
- No existing number was ported.
- No existing number was forwarded.
- Phone webhooks remain disabled.
- SMS sending remains disabled.
- Call recording remains disabled.
- AI auto-send remains disabled.

## Stop conditions

Stop and do not promote if any repository file contains:

- Actual phone number or phone-like number.
- Provider credential.
- SIP credential.
- Webhook secret.
- Invoice, screenshot, or purchase document content.
- Customer data or message/call payload.

## Next safe action

After QL-025 is GREEN, proceed to QL-026 connection readiness review without enabling live phone/SMS features.
