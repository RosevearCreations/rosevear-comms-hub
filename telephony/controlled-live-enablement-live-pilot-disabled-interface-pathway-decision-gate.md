# Telephony Note — QL-068 Disabled Interface Pathway Decision Gate

QL-068 does not change telephony runtime.

## Decision

- The future disabled interface path should plan around GitHub Pages as a static UI candidate.
- Any future telephony/provider secret, callback verification, webhook validation, service-role operation, or provider API action must remain server-side, with Supabase Edge Functions reserved as the later backend boundary.

## Telephony remains disabled

- Provider callbacks: disabled.
- Webhooks: disabled.
- SMS sending: disabled.
- Call runtime: disabled.
- Call recording: disabled.
- Transcripts: disabled.
- AI draft generation and auto-send: disabled.
- Persistence writes: disabled.
- Archive writes: disabled.
- Retention policy writes: disabled.
- Live customer data access: disabled.
- Live pilot runtime: disabled.

## Secret handling

No telephony secret, callback token, provider credential, phone number, message body, transcript, recording, or live customer record may be placed into a static interface or browser bundle.
