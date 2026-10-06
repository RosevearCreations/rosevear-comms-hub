# Remote Operator — QL-029 Phone/SMS Disabled Dry-Run Evidence Mapping Review

Use this checklist when promoting QL-029.

## Steps

1. Confirm `main` is QL-028 Production GREEN.
2. Create the QL-029 branch from the current `main` production commit.
3. Add the evidence mapping helper, fixture, source-of-truth document, build record, ops checklist, and telephony notes.
4. Confirm no actual phone numbers, credentials, secrets, customer data, live payloads, recordings, transcripts, invoices, screenshots, or ownership documents are committed.
5. Open a pull request into `dev`.
6. Wait for PR CI to pass.
7. Merge to `dev` only after CI is green.
8. Open an exact-tree promotion pull request from `dev` to `main`.
9. Merge to `main` only through the established production promotion path.
10. Confirm the `main` push CI is green.

## Manual operator reminders

- Do not configure provider webhooks.
- Do not paste provider portal screenshots.
- Do not paste the purchased test number.
- Do not enable SMS sending, phone webhooks, call recording, AI drafts, or AI auto-send.
- Do not use live customer records.

## Production GREEN proof

`main` is GREEN only after `npm install`, `npm run check`, and `npm run build` pass on the production merge commit.
