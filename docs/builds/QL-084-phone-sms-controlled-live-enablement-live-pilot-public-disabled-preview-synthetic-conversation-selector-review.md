# QL-084 Build Record

## Build

QL-084 — Public Disabled Preview Synthetic Conversation Selector Review

## Summary

This build reviews the QL-083 browser-local synthetic conversation selector.

## Outcome

- Public preview updated to QL-084 selector-review mode.
- Brand switcher remains active for Rosie Dazzlers and Devil n Dove.
- Synthetic conversation selector remains active for hard-coded local sample conversations.
- Review findings confirm the selector changes only synthetic summary, draft-only copy, and timeline content.
- Locked live action buttons remain disabled.
- QL-085 is queued as the synthetic conversation detail-tabs planning build.

## Safety boundary

No provider callbacks, live phone webhooks, SMS sending, call runtime, recording, AI send, persistence writes, live customer access, archive writes, retention policy writes, Supabase runtime changes, provider account connection, live-number attachment, callback registration, Supabase migration, Supabase Edge Function, Vercel, Cloudflare Pages, or live pilot runtime is enabled.

## Verification targets

- `npm install`
- `npm run check`
- `npm run build`
- Main App scaffold CI
- Main GitHub Pages Disabled Preview deployment
