# QL-116 Telephony Boundary

QL-116 does not enable telephony.

The following remain prohibited:

- Phone/SMS sends.
- Inbound handlers.
- DTMF handling.
- Provider callbacks.
- Recordings.
- Consent writes.
- Archives, audits, retention, cleanup, and purge automation.
- AI generation/send.
- Live pilot runtime.

Any later telephony work must be separately scoped, owner-approved, dry-run first, duplicate-safe, rollbackable, purgeable, emergency-disable ready, fail-closed, and promoted GREEN on exact production gates.
