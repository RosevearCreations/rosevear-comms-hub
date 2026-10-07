# Phone/SMS Controlled Live Enablement Disabled Runtime Verification Execution Plan — Ops Checklist

## Operator rule

Do not execute runtime verification during QL-043.

QL-043 is an execution plan only. It prepares QL-044 disabled dry-run case definition and does not enable live pilot runtime.

## Required confirmations

- QL-042 disabled runtime verification scaffold is ready.
- Evidence remains synthetic and redacted.
- Provider webhooks remain unconfigured.
- Provider callbacks remain disabled.
- Phone webhooks remain disabled.
- SMS sending remains disabled.
- Call recording remains disabled.
- AI drafts and AI auto-send remain disabled.
- Persistence writes remain disabled.
- Live customer reads and writes remain disabled.
- Live pilot runtime remains disabled.

## Execution-plan checks

Confirm plans exist for:

- Execution window.
- Synthetic fixtures.
- Feature-flag preflight.
- Provider callback disabled case.
- Phone webhook disabled case.
- SMS send disabled case.
- Call recording disabled case.
- AI disabled cases.
- Persistence write disabled case.
- Live customer access disabled case.
- Manual operator handoff case.
- Rate limit, replay protection, and idempotency cases.
- Redacted observability.
- Rollback kill switch.
- Success and abort criteria.
- Post-review gate.

## Block release if

- Any live runtime behavior is enabled.
- Any provider webhook is configured.
- Any real phone number, customer data, provider payload, recording, transcript, invoice, screenshot, ownership document, credential, webhook secret value, or real operator identity is committed.
- Any output is marked safe to persist.
- A Supabase migration is added.

## Production proof

Production is GREEN only after the final `main` push CI passes `npm install`, `npm run check`, and `npm run build` on the promoted commit.
