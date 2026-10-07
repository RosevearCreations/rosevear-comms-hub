# Remote Operator Checklist — QL-044 Disabled Runtime Verification Dry-Run Cases

## Feature PR to dev

1. Confirm the branch is `ql-044-phone-sms-controlled-live-enablement-disabled-runtime-verification-dry-run-cases`.
2. Confirm the PR targets `dev`.
3. Confirm the changed files are limited to the QL-044 helper, fixture, documentation, ops, telephony, remote checklist, and build sequence update.
4. Confirm App scaffold CI passes:
   - `npm install`
   - `npm run check`
   - `npm run build`

## Production promotion

1. Promote the exact `dev` tree to `main` through a promotion PR.
2. Confirm promotion PR CI passes.
3. Merge to `main` only after CI is green.
4. Confirm final `main` push CI passes.

## Safety verification

Confirm QL-044 does not:

- Enable live phone/SMS behavior.
- Configure provider webhooks.
- Allow provider callback delivery.
- Send SMS.
- Record calls.
- Enable AI drafts or AI auto-send.
- Write persistence records.
- Access live customer records.
- Execute the dry run.

## Next queued build

QL-045 — Phone/SMS Controlled Live Enablement Disabled Runtime Verification Dry-Run Result Review.
