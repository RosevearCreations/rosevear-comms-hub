# QL-112 Telephony Boundary

QL-112 does not enable telephony.

## Explicitly excluded

- Phone provider runtime.
- SMS provider runtime.
- Outbound sends.
- Inbound handling.
- DTMF processing.
- Call recordings.
- Provider callbacks.
- Consent writes.
- Live pilot runtime.
- AI-generated phone or SMS delivery.

## Allowed in QL-112

Only display-only review text is allowed.

QL-112 may state that future owner-decision planning must keep telephony out of scope unless a separate, owner-approved telephony build later changes that boundary.

## Required boundary

Every QL-112 review result must preserve this rule:

> No Phone/SMS, provider callback, consent, recording, DTMF, AI delivery, or live pilot behavior may be introduced by this build.
