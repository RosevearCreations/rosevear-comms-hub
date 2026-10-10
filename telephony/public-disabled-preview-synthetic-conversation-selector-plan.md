# Telephony Boundary — QL-082 Synthetic Conversation Selector Plan

QL-082 keeps the public disabled preview outside live telephony.

## Allowed

- Static GitHub Pages preview.
- Existing browser-local brand switcher.
- Planning for a future synthetic conversation selector.
- Hard-coded sample labels and sample text.
- Browser-local React state only in the future implementation.

## Blocked

- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Call recording.
- Transcripts.
- Provider inbox imports.
- Supabase conversation reads/writes.
- Live customer access.
- AI reply generation or send.
- Archive writes.
- Retention writes.
- Live pilot runtime.

## Result

QL-082 can approve only QL-083 synthetic conversation selector implementation with hard-coded samples and browser-local state.
