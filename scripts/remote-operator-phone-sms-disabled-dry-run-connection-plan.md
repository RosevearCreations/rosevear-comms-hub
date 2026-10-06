# Remote Operator — QL-027 Phone/SMS Disabled Dry-Run Connection Plan

Use this checklist when promoting QL-027.

## Steps

1. Confirm `dev` and `main` start from the same QL-026 GREEN tree.
2. Create `ql-027-phone-sms-disabled-dry-run-connection-plan` from that baseline.
3. Add the disabled dry-run connection plan helper and fixture.
4. Add source-of-truth documentation, build record, ops checklist, and telephony notes.
5. Update README, `.env.example`, and `docs/08_BUILD_SEQUENCE.md`.
6. Open a PR into `dev`.
7. Wait for App scaffold CI to pass.
8. Merge into `dev` only after CI is GREEN.
9. Promote the exact dev tree to `main` through the repository-required pull request path.
10. Wait for final `main` App scaffold CI to pass.

## Required proof

- `npm install` passes.
- `npm run check` passes.
- `npm run build` passes.
- `main` points to the QL-027 promotion commit.

## Do not include

- Actual phone numbers.
- Provider credentials.
- SIP credentials.
- Webhook secret values.
- Invoices, screenshots, receipts, or ownership documents.
- Customer data.
- Live payloads.
- Call recordings or transcripts.
- Existing numbers.
- Any live provider webhook configuration.
