# QL-069 Ops Checklist — Disabled Interface Implementation Plan

## Operator-visible outcome

- Confirm the app includes an **Interface preview** control.
- Confirm the preview opens a static disabled dashboard mockup.
- Confirm the mockup communicates the combined Quo-lite direction for brand inbox, customer timeline, task board, and Phone/SMS controls.

## Required disabled checks

Verify all of the following remain disabled or absent:

- GitHub Pages deployment.
- Vercel deployment.
- Cloudflare Pages deployment.
- Supabase migration.
- Supabase Edge Function.
- Provider account connection.
- Live number attachment.
- Callback registration.
- Provider callbacks.
- Phone webhooks.
- SMS sending.
- Call runtime.
- Call recording.
- AI draft/send runtime.
- Persistence writes.
- Live customer reads and writes.
- Archive writes.
- Retention policy writes.
- Live pilot runtime.

## Browser safety checks

- Confirm no service-role key is present in browser code.
- Confirm no provider credential is present in browser code.
- Confirm no callback token is present in browser code.
- Confirm the only browser variables planned for later are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Completion proof

- Feature CI passes `npm install`.
- Feature CI passes `npm run check`.
- Feature CI passes `npm run build`.
- Promotion CI passes before merge to `main`.
- Final `main` push CI passes before declaring production GREEN.
