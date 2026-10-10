# QL-089 Ops Checklist — Browser-Safe Supabase Read-Only Client Plan

## Review checks

- Confirm the preview badge shows QL-089.
- Confirm the header names the browser-safe Supabase read-only client plan.
- Confirm the UI states that no Supabase browser client is instantiated yet.
- Confirm the allowed future read sources are synthetic-only.
- Confirm the blocked sources include contacts, conversations, messages, phone calls, SMS messages, consent logs, admin allowlists, audit events, archives, retention records, provider payloads, and live customer records.
- Confirm missing env values, failed reads, and unexpected payloads fall back to hard-coded samples.
- Confirm all live actions remain disabled.

## Deployment checks

- App scaffold CI must pass on feature PR, promotion PR, and final `main`.
- Supabase Preview must pass on final `main`.
- Cloudflare Worker build must pass on final `main`.
- GitHub Pages disabled preview should update when app files change.

## Do not enable

- Phone provider callbacks
- SMS send runtime
- Call runtime
- Recording/transcription runtime
- Live customer reads/writes
- Archive writes
- Retention writes
- AI auto-send
- Live pilot runtime
