# QL-067 Ops Checklist — Disabled Operator Console Post-Closure Readiness Review

## Allowed

- Review the QL-066 closed evidence set.
- Confirm the evidence remains synthetic, redacted, review-only, closure-only, and unsafe to persist.
- Confirm the disabled operator console remains reachable, visible, and reviewable.
- Confirm every future action remains disabled.
- Confirm the next build is only a disabled interface pathway decision gate.

## Not allowed

- Do not add or test provider credentials.
- Do not connect a provider account.
- Do not attach a live number.
- Do not add a callback route or webhook.
- Do not send SMS.
- Do not call a customer.
- Do not record or transcribe a call.
- Do not enable AI drafts or AI auto-send.
- Do not write persistence, archive, or retention records.
- Do not inspect live customer data.
- Do not add Vercel, Cloudflare Pages, or GitHub Pages deployment.
- Do not add a Supabase migration.
- Do not start live pilot runtime.

## Review evidence

Accept only synthetic/redacted labels and CI/build proof.

Reject any evidence containing:

- Secret values.
- Callback tokens.
- Live phone numbers.
- Message bodies.
- Transcripts or recordings.
- Live customer data.
- Enabled runtime controls.
- Hosting changes.
- Persistence/archive/retention writes.

## Production proof

QL-067 is complete only after `main` passes the app scaffold CI workflow.
