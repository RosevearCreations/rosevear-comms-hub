# QL-072 — GitHub Pages Disabled Preview Deployment Enablement Gate

## Status

Complete after promotion.

## Summary

QL-072 adds the gated GitHub Pages workflow for the Quo-lite disabled interface preview.

## Changes

- Added `pages:build` script in `app/package.json`.
- Added `.github/workflows/pages-disabled-preview.yml`.
- Updated `DisabledInterfacePreview` to show QL-072 enablement state.
- Added typed guard and contract fixture.
- Added source-of-truth, ops, remote-operator, and telephony notes.

## Safety boundary

The workflow is gated by `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true` and deploys only static assets from `app/dist`.

No live Phone/SMS provider, callback, webhook, SMS send, call runtime, recording, AI auto-send, persistence write, live customer access, archive write, retention write, provider account connection, live-number attachment, callback registration, Supabase migration, Supabase Edge Function, Vercel deployment, Cloudflare Pages deployment, or live pilot runtime is enabled.

## Verification target

- `npm install`
- `npm run check`
- `npm run build`

## Public URL

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

This URL requires GitHub Pages Source set to GitHub Actions and `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true` before it can work.
