# Telephony Boundary — QL-108 Bounded Implementation Decision Planning

QL-108 does not enable telephony.

## Still disabled

- Phone/SMS sends
- Phone/SMS inbound processing
- Provider callbacks
- DTMF runtime
- Consent writes
- Call recordings
- Live pilot runtime
- AI-generated outbound messages

## Decision-planning rule

Any future implementation decision must keep telephony disabled unless a separate owner-approved telephony build explicitly authorizes a narrow runtime path with consent, audit, rollback, emergency disable, and production verification.

QL-108 grants no such authorization.
