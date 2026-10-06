# Remote Operator Checklist — QL-030

## Build

QL-030 — Phone/SMS Disabled Dry-Run Human Review Gate.

## Purpose

Use this checklist to verify and promote the QL-030 branch through `dev` and `main`.

## Required review

Confirm the branch adds only synthetic, non-live, non-persistent human review gate artifacts.

Required files:

```text
api/deployment/phoneSmsDisabledDryRunHumanReviewGate.ts
api/contracts/phone-sms-disabled-dry-run-human-review-gate.example.json
docs/43_PHONE_SMS_DISABLED_DRY_RUN_HUMAN_REVIEW_GATE.md
docs/builds/QL-030-phone-sms-disabled-dry-run-human-review-gate.md
ops/telephony/phone-sms-disabled-dry-run-human-review-gate.md
scripts/remote-operator-phone-sms-disabled-dry-run-human-review-gate.md
telephony/disabled-dry-run-human-review-gate.md
```

Required updates:

```text
.env.example
README.md
docs/08_BUILD_SEQUENCE.md
```

## Required CI

The App scaffold CI must pass:

```text
npm install
npm run check
npm run build
```

## Promotion path

1. Open PR from `ql-030-phone-sms-disabled-dry-run-human-review-gate` into `dev`.
2. Wait for App scaffold CI to pass.
3. Merge into `dev`.
4. Open PR from `dev` into `main`.
5. Wait for the promotion PR CI to pass when available.
6. Merge into `main`.
7. Verify the resulting `main` push CI is green.

## Stop conditions

Do not promote if the branch adds or enables:

- actual phone numbers
- provider credentials
- webhook secret values
- SIP credentials
- provider callback route enablement
- SMS sending
- call recording
- AI drafts
- AI auto-send
- persistence writes
- live customer reads or writes
- customer data
- mapped live records
- live provider payloads
- recordings or transcripts
- invoices, screenshots, receipts, or ownership documents

## Completion statement

When complete, report:

```text
QL-030 promoted. main Production = GREEN.
```
