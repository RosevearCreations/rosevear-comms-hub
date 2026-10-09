# Ops Checklist — QL-068 Disabled Interface Pathway Decision Gate

## Required checks

- Confirm QL-067 is complete before this decision gate.
- Confirm no hosting deployment was added.
- Confirm no GitHub Pages workflow was added.
- Confirm no Vercel or Cloudflare Pages project was added.
- Confirm no Supabase migration or Edge Function was added.
- Confirm no provider account was connected.
- Confirm no callback route or webhook was enabled.
- Confirm no live phone/SMS runtime path exists.
- Confirm browser code does not include service-role secrets, provider credentials, callback tokens, live numbers, live customer data, message bodies, transcripts, or recordings.

## Approved decision only

- Future disabled static interface candidate: GitHub Pages.
- Future backend boundary candidate: Supabase Edge Functions.
- Next build: disabled interface implementation plan.

## Still blocked

- Provider callbacks
- Phone webhooks
- SMS sending
- Call runtime
- Call recording
- AI drafts and auto-send
- Persistence writes
- Live customer reads/writes
- Archive writes
- Retention policy writes
- Provider account connection
- Live number attachment
- Callback registration
- Live pilot runtime
