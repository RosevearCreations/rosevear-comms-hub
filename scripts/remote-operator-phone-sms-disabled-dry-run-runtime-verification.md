# Remote Operator — QL-028 Phone/SMS Disabled Dry-Run Runtime Verification

Use this checklist when promoting QL-028.

## Steps

1. Confirm `dev` and `main` start from the same QL-027 GREEN tree.
2. Create the QL-028 working branch from `dev`.
3. Add the runtime verification helper, fixture, source-of-truth doc, build record, ops checklist, and telephony notes.
4. Confirm the build contains no actual phone numbers, credentials, webhook secret values, invoices, screenshots, ownership documents, customer data, live payloads, recordings, transcripts, or existing numbers.
5. Open a PR into `dev` and wait for app CI to pass.
6. Merge the exact verified tree into `dev`.
7. Open a PR from `dev` into `main` and wait for app CI to pass.
8. Merge the exact verified tree into `main`.
9. Confirm `main` CI is GREEN.

## Required checks

- Disabled mode expected status remains `503`.
- Synthetic voice dry-run fixture does not persist.
- Synthetic SMS dry-run fixture does not persist.
- Non-synthetic payloads are rejected.
- Provider webhook remains unconfigured.
- Phone webhooks, SMS sending, call recording, AI drafts, AI auto-send, persistence writes, live customer reads, and live customer writes remain disabled.

## Stop conditions

Stop and do not promote if any of these appear:

- Actual purchased test number or existing phone number.
- Provider credentials, SIP credentials, or webhook secret values.
- Customer data, live payload, recording, or transcript.
- Provider webhook configuration instructions.
- Live SMS sending, call recording, AI auto-send, or live customer access enablement.
- Failed, cancelled, or queued required CI on the exact commit being promoted.
