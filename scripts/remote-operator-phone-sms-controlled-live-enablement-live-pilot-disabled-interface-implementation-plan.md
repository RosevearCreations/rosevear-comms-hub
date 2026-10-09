# Remote Operator Checklist — QL-069 Disabled Interface Implementation Plan

Use this checklist when reviewing QL-069 remotely.

## What should be visible

- The existing admin inbox still loads.
- A floating **Interface preview** control is available.
- Opening the preview shows a static Quo-lite operator dashboard direction.
- The preview includes brand selection, queue stats, customer timeline, disabled controls, planned regions, and implementation checklist.

## What must remain disabled

Do not enable or add:

- GitHub Pages deployment.
- Vercel deployment.
- Cloudflare Pages deployment.
- Supabase migration.
- Supabase Edge Function.
- Provider account connection.
- Live provider number.
- Callback registration.
- SMS sending.
- Call runtime.
- Recordings or transcripts.
- AI auto-send.
- Persistence writes.
- Archive writes.
- Retention policy writes.
- Live pilot runtime.

## Secrets rule

The visible preview must not contain service-role keys, provider credentials, callback tokens, live customer phone numbers, message bodies from live sources, transcripts, recordings, or live customer data.

## Manual intervention

None for this build.
