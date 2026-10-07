# Ops Checklist — QL-042 Disabled Runtime Verification Scaffold

## Operator rule

Do not enable live traffic during QL-042.

## Confirm before promotion

- QL-042 adds a disabled runtime verification scaffold only.
- Every probe returns a disabled/no-op/rejected/manual-review response.
- Provider webhooks remain unconfigured.
- Provider callbacks remain disabled.
- Phone webhooks remain disabled.
- SMS sending remains disabled.
- Call recording remains disabled.
- AI drafts and AI auto-send remain disabled.
- Persistence writes remain disabled.
- Live customer reads and writes remain disabled.
- Live pilot runtime remains disabled.

## Required disabled probe surfaces

- Feature-flag boundary.
- Provider callback validation.
- Phone webhook disabled response.
- SMS send disabled response.
- Call recording disabled response.
- AI draft and auto-send disabled response.
- Persistence-write disabled response.
- Live customer access disabled response.
- Manual operator handoff.
- Rate limits, replay protection, and idempotency.
- Redacted observability.
- Rollback kill switch.
- Success, abort, and post-review gates.

## Block release if present

- Actual phone numbers.
- Provider credentials or webhook secret values.
- Customer data or live provider payloads.
- Recordings or transcripts.
- Screenshots, invoices, ownership documents, or real operator identities.
- Supabase migration.
- Any enabled live runtime behavior.

## Production proof

Production GREEN requires final `main` push CI success for `npm install`, `npm run check`, and `npm run build`.
