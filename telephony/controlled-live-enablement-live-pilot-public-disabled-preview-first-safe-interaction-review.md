# Telephony Boundary — QL-081 First Safe Interaction Review

QL-081 reviews a public preview UI interaction only.

## Allowed

- Browser-local React state.
- Synthetic Rosie Dazzlers / Devil n Dove sample brand switching.
- Static public preview rendering through GitHub Pages.
- Review text explaining the next safe interaction candidate.

## Not allowed

- Provider callbacks.
- Live phone webhooks.
- SMS send or receive.
- Call start, answer, transfer, or recording.
- Provider account connection.
- Live number attachment.
- Callback registration.
- Supabase-backed live inbox reads.
- Live customer reads or writes.
- Persistence writes.
- Archive writes.
- Retention policy writes.
- AI reply generation or auto-send.
- Live pilot runtime.

## Review decision

The first safe interaction can remain in the preview. QL-082 may only plan a synthetic conversation selector if it keeps the same disabled, browser-local, synthetic boundary.
