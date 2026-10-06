# Remote Operator Checklist — QL-037 Phone/SMS Controlled Live Enablement Disabled Verification

## Branch

```text
ql-037-phone-sms-controlled-live-enablement-disabled-verification
```

## Feature PR to dev

1. Confirm changed files are limited to QL-037 helper, fixture, docs, checklists, `.env.example`, README, and build sequence.
2. Confirm no real phone numbers, credentials, webhook secrets, customer data, live payloads, recordings, transcripts, invoices, screenshots, or ownership documents are committed.
3. Confirm App scaffold CI passes:

```text
npm install
npm run check
npm run build
```

4. Merge to `dev` only after CI is green.

## Promotion PR to main

1. Open `dev` → `main` promotion PR.
2. Confirm the promoted dev head is the exact QL-037 merge commit.
3. Prefer promotion PR CI when it attaches.
4. If GitHub does not attach promotion PR CI, require the final `main` push CI to pass before declaring Production GREEN.
5. Merge only the exact reviewed tree.

## Final production verification

After merge to `main`, confirm the push CI passes:

```text
npm install
npm run check
npm run build
```

## Stop conditions

Stop and do not promote if any of these happen:

- CI fails.
- A live provider callback is enabled.
- Phone webhooks are enabled.
- SMS sending is enabled.
- Call recording is enabled.
- AI draft or auto-send is enabled.
- Persistence writes are enabled.
- Live customer reads or writes are enabled.
- Evidence is not synthetic and redacted.
- Real phone/provider/customer artifacts appear.

## Next queued build after QL-037

```text
QL-038 — Phone/SMS Controlled Live Enablement Manual Go/No-Go Gate
```
