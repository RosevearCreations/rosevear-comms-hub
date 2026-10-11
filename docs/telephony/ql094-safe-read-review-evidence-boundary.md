# Telephony boundary — QL-094 Safe Read Review and Evidence

QL-094 does not change telephony behavior.

## Still disabled

- Inbound phone webhooks.
- Outbound calls.
- SMS send or receive runtime.
- MMS runtime.
- DTMF handling.
- Provider callback registration.
- Provider account connection.
- Live number attachment.
- Call recordings.
- Archive writes.
- Retention writes.

## Allowed

QL-094 may display bounded evidence that the public disabled preview is using local fallback rows or validated synthetic public rows only.
