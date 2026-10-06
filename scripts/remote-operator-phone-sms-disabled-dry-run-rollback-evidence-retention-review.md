# Remote Operator Checklist — QL-032 Rollback and Evidence Retention Review

Use this checklist for the remote GitHub-only promotion path.

## Branch

```text
ql-032-phone-sms-disabled-dry-run-rollback-evidence-retention-review
```

## Steps

1. Confirm `main` is QL-031 GREEN.
2. Create the QL-032 branch from current `main`.
3. Add the rollback/retention helper, fixture, source-of-truth doc, build record, ops checklist, telephony notes, and this checklist.
4. Update `.env.example`, `README.md`, and `docs/08_BUILD_SEQUENCE.md`.
5. Confirm no forbidden material was added:
   - actual phone numbers.
   - real operator identities.
   - provider credentials.
   - webhook secret values.
   - screenshots, invoices, or ownership documents.
   - live provider payloads.
   - customer data.
   - recordings or transcripts.
   - Supabase migrations.
6. Open PR into `dev`.
7. Wait for PR CI:
   - `npm install`.
   - `npm run check`.
   - `npm run build`.
8. Merge into `dev` only after CI is GREEN.
9. Open promotion PR from `dev` to `main`.
10. Wait for promotion PR CI when it attaches.
11. Merge into `main` only after promotion CI is GREEN.
12. Verify the final `main` push CI is GREEN.

## Production GREEN output

Only report production GREEN after the final `main` push has passed:

```text
main Production = GREEN
```

## Safety reminder

QL-032 is planning-only. It does not authorize a provider connection, provider callback, webhook route, persistence write, live customer read/write, SMS send, call recording, AI draft, or AI auto-send.
