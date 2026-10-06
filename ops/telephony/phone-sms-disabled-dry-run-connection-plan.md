# Phone/SMS Disabled Dry-Run Connection Plan — Operator Checklist

Build: QL-027

## Before QL-028

Confirm all items below are true before runtime verification:

- QL-026 connection readiness is complete.
- Provider label is recorded without credentials.
- Purchased-number alias label is recorded without the actual number.
- Provider portal configuration has been reviewed.
- Provider webhook remains unconfigured.
- Only the webhook secret name is planned; the value is not recorded.
- Synthetic voice/SMS fixtures are planned when capability requires them.
- Contact/conversation/task mapping uses synthetic data only.
- Persistence writes are disabled.
- Live customer reads and writes are disabled.
- Rate-limit, idempotency, replay protection, logging redaction, and rollback plans are reviewed.

## Do not do these in QL-027

- Do not paste the actual test number.
- Do not paste provider credentials, SIP credentials, tokens, passwords, or webhook secret values.
- Do not configure the provider webhook.
- Do not connect live callbacks.
- Do not turn on SMS sending.
- Do not enable call recording.
- Do not enable AI drafts or AI auto-send.
- Do not use live customer data.
- Do not port or forward any existing number.

## Required safe result

The repository may show a disabled dry-run plan, but runtime connection remains blocked until QL-028 verifies disabled-mode behavior with synthetic payloads only.
