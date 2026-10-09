# QL-069 — Phone/SMS Controlled Live Enablement Live-Pilot Disabled Interface Implementation Plan

## Purpose

QL-069 turns the QL-068 pathway decision into a visible disabled interface preview inside the existing app so the operator direction can be reviewed before any hosting or live runtime is enabled.

This build intentionally answers the need to see an interface while keeping the system safe and disabled.

## Visible interface preview

QL-069 adds a floating **Interface preview** panel mounted in the app shell.

The preview shows:

- Brand switcher direction for Rosie Dazzlers and Devil n Dove.
- Unified operator inbox direction.
- Customer/contact summary direction.
- Conversation timeline direction.
- Disabled Phone/SMS command controls.
- Follow-up task board direction.
- Safe deployment status.
- Manual readiness checklist direction.

The preview is static, disabled, and review-only.

## Pathway decision carried forward

QL-068 selected GitHub Pages only as a future disabled static interface candidate. QL-069 keeps that decision as a plan only.

QL-069 does not add a GitHub Pages workflow, does not configure GitHub Pages, and does not deploy a hosted interface.

## Browser variable boundary

A later static deployment may use only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No service-role key, provider credential, callback token, webhook signing secret, live phone number, message body, transcript, recording, or live customer data may be exposed to browser code.

## Server-only boundary reserved for later

A later Supabase Edge Function boundary may be used for:

- Provider secrets.
- Service-role work.
- Callback verification.
- Webhook handling.
- Live provider delivery controls after explicit approval.

QL-069 does not add Supabase migrations or Supabase Edge Functions.

## Disabled runtime boundary

QL-069 keeps all of the following disabled:

- GitHub Pages deployment.
- Vercel deployment.
- Cloudflare Pages deployment.
- Supabase migration.
- Supabase Edge Function.
- Provider account connection.
- Provider live-number attachment.
- Callback registration.
- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Call recording.
- AI drafts.
- AI auto-send.
- Persistence writes.
- Live customer reads and writes.
- Dry-run execution.
- Provider delivery.
- Archive writes.
- Retention policy writes.
- Live pilot runtime.

## Manual intervention

None for QL-069.

Do not add GitHub Pages, Vercel, Cloudflare Pages, Supabase migrations, Supabase Edge Functions, provider credentials, callback routes, live numbers, browser-held service-role secrets, persistence writes, archive writes, retention policy writes, or live Phone/SMS runtime paths in this build.

## Completion criteria

QL-069 is complete when:

- The visible disabled interface preview is mounted in the app.
- The preview clearly shows the intended operator direction.
- All live/provider/runtime/persistence/hosting controls remain disabled.
- The QL-069 guard and contract fixture exist.
- The source-of-truth documentation, ops note, telephony note, and remote operator checklist exist.
- CI passes `npm install`, `npm run check`, and `npm run build`.
