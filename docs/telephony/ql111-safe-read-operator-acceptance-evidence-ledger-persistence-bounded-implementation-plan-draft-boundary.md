# QL-111 Telephony Boundary

QL-111 does not change telephony behavior.

Blocked surfaces include:

- Phone/SMS provider runtime.
- Outbound sends.
- Inbound processing.
- Callbacks and webhooks.
- DTMF handling.
- Recordings.
- Consent writes.
- Live pilot runtime.
- AI generation or delivery.

The bounded implementation plan draft may mention these items only as excluded surfaces and stop conditions. It must not add routes, handlers, provider configuration, queues, logs, archives, audit/admin writes, retention jobs, or runtime code.
