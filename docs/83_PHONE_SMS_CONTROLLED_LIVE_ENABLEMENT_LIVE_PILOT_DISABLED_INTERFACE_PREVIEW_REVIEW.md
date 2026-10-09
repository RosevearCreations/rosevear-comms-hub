# QL-070 — Phone/SMS Controlled Live Enablement Live-Pilot Disabled Interface Preview Review

## Purpose

QL-070 reviews the visible disabled interface preview added in QL-069. The goal is to confirm the interface direction is useful enough for operator review while keeping every live path disabled.

## Review finding

The visible preview is directionally useful. It shows the expected Quo-lite operator surface:

- brand switcher
- inbox queue
- customer/contact summary
- conversation timeline
- disabled Phone/SMS controls
- follow-up task board
- safe deployment status
- manual readiness checklist

The preview is still static, synthetic, disabled, browser-safe, and review-only.

## Link status

Planned future static preview URL:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

That URL is not live in QL-070. QL-070 does not add a GitHub Pages workflow and does not deploy GitHub Pages.

## Decision

QL-070 approves only the next planning build:

```text
QL-071 — Phone/SMS Controlled Live Enablement Live-Pilot GitHub Pages Disabled Preview Deployment Plan
```

That next build should prepare a static GitHub Pages disabled preview path using browser-safe variables only.

## Browser boundary

A future static preview may use only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only secrets must remain out of browser code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PHONE_SMS_PROVIDER_API_KEY`
- `PHONE_SMS_PROVIDER_API_SECRET`
- `PHONE_SMS_WEBHOOK_SIGNING_SECRET`
- `PHONE_SMS_CALLBACK_TOKEN`

## Explicitly not enabled in QL-070

- GitHub Pages workflow
- GitHub Pages deployment
- Vercel hosting
- Cloudflare Pages hosting
- Supabase migration
- Supabase Edge Function
- provider account connection
- provider callback route
- phone webhook
- live number attachment
- SMS sending
- call runtime
- call recording
- AI drafts
- AI auto-send
- persistence writes
- live customer reads or writes
- archive writes
- retention policy writes
- callback registration
- live pilot runtime

## Manual intervention

No manual intervention is required for QL-070.
