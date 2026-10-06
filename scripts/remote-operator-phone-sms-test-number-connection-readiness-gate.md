# Remote Operator Checklist — QL-026 Phone/SMS Test Number Connection Readiness Gate

Use this checklist when reviewing QL-026 without local shell access.

## Repository checks

- Confirm `api/deployment/phoneSmsTestNumberConnectionReadinessGate.ts` exists.
- Confirm `api/contracts/phone-sms-test-number-connection-readiness-gate.example.json` exists.
- Confirm `docs/39_PHONE_SMS_TEST_NUMBER_CONNECTION_READINESS_GATE.md` exists.
- Confirm README current stage is QL-026.
- Confirm build sequence marks QL-026 complete and QL-027 next.

## Safety checks

- Search the branch for actual phone numbers before promotion.
- Search the branch for `api key`, `password`, `secret`, `token`, `sip`, `invoice`, `screenshot`, `recording`, and `transcript` before promotion.
- Confirm no provider credentials, webhook secrets, SIP credentials, invoices, screenshots, ownership documents, customer data, live payloads, recordings, or transcripts were committed.
- Confirm `ENABLE_PHONE_WEBHOOKS=false`.
- Confirm `ENABLE_SMS=false`.
- Confirm `ENABLE_CALL_RECORDING=false`.
- Confirm `ENABLE_AI_DRAFTS=false`.
- Confirm `ENABLE_AI_AUTO_SEND=false`.

## Promotion checks

- Open PR to `dev`.
- Wait for App scaffold CI to pass.
- Merge to `dev`.
- Promote to `main` using the repository-required PR path if direct main updates are blocked.
- Wait for final `main` App scaffold CI to pass.
