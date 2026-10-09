# Telephony Boundary — QL-071 GitHub Pages Disabled Preview Deployment Plan

## Boundary

QL-071 plans a static GitHub Pages disabled preview. It does not alter the Phone/SMS live enablement boundary.

## Static preview rules

- The target public review URL is `https://rosevearcreations.github.io/rosevear-comms-hub/`.
- The planned preview must be static, disabled, review-only, and browser-safe.
- The preview must not contain service-role keys, provider credentials, callback tokens, live phone numbers, live message bodies, transcripts, recordings, or live customer data.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` may be considered for browser variables later.

## Runtime still disabled

- Provider account connection: disabled.
- Provider live-number attachment: disabled.
- Callback registration: disabled.
- Provider callbacks: disabled.
- Live phone webhooks: disabled.
- SMS sending: disabled.
- Call runtime: disabled.
- Recording: disabled.
- AI drafts and auto-send: disabled.
- Persistence writes: disabled.
- Live customer reads/writes: disabled.
- Archive writes: disabled.
- Retention policy writes: disabled.
- Live pilot runtime: disabled.

## Next safe step

QL-071 approves only a later GitHub Pages disabled preview deployment enablement gate.
