# QL-107 Telephony Boundary

QL-107 does not change telephony behavior.

## Explicitly disabled

- Phone/SMS provider sends.
- Inbound callbacks.
- DTMF runtime.
- Call recording handling.
- Consent writes.
- Message body persistence.
- Provider payload storage.
- Live pilot runtime.

## Allowed in QL-107

Only display-only review copy is allowed. QL-107 may describe future telephony lockout requirements as text, but it does not implement any route, provider connection, webhook, queue, consent ledger, archive path, or audit path.
