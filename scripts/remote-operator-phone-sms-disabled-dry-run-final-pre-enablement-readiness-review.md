# Remote Operator Checklist — QL-033 Final Pre-Enablement Readiness Review

Use this checklist when promoting QL-033 remotely through GitHub.

## Branch

```text
ql-033-phone-sms-disabled-dry-run-final-pre-enablement-readiness-review
```

## PR 1 — feature branch to dev

1. Open a pull request from the QL-033 branch into `dev`.
2. Confirm changed files are limited to the QL-033 helper, fixture, docs, checklists, telephony notes, README, environment template, and build sequence.
3. Confirm no actual phone numbers, credentials, webhook secret values, screenshots, invoices, recordings, transcripts, customer data, or live payloads are present.
4. Wait for App scaffold CI.
5. Require:

```text
npm install — success
npm run check — success
npm run build — success
```

6. Merge into `dev` only after CI is green.

## PR 2 — dev to main

1. Open a promotion pull request from `dev` into `main`.
2. Confirm the promotion PR head matches the exact `dev` merge commit from PR 1.
3. Wait for App scaffold CI when available.
4. Require:

```text
npm install — success
npm run check — success
npm run build — success
```

5. Merge into `main` only after promotion CI is green.

## Final production check

After merging to `main`, wait for the `main` push CI.

Require:

```text
npm install — success
npm run check — success
npm run build — success
```

Only then call:

```text
main Production = GREEN
```

## Stop conditions

Stop and do not promote if any of these appear:

- actual phone numbers
- provider credentials
- SIP credentials
- webhook secret values
- customer data
- live payloads
- recordings
- transcripts
- invoices
- screenshots
- ownership documents
- real operator identities
- Supabase migration
- provider callback route enablement
- phone webhook enablement
- SMS sending enablement
- call recording enablement
- AI draft or auto-send enablement
