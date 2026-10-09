# Remote Operator Checklist — QL-072 GitHub Pages Disabled Preview Deployment Enablement Gate

## Purpose

Use this checklist when preparing the static disabled GitHub Pages preview for operator review.

## Required manual GitHub settings

1. Repository: `RosevearCreations/rosevear-comms-hub`.
2. Settings → Pages.
3. Set Source to GitHub Actions.
4. Settings → Secrets and variables → Actions → Variables.
5. Add `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW = true` only when the static disabled preview should deploy.
6. Optional public-only variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Review URL

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

## Confirmation checklist

- The preview loads as a static review app.
- It shows QL-072 state.
- Phone/SMS action buttons remain disabled.
- No live SMS sends.
- No calls start.
- No provider callbacks are configured.
- No live customer data appears.
- No transcripts or recordings appear.
- No persistence writes occur.
- No archive or retention writes occur.

## Stop condition

If any live-provider, live-customer, SMS, call, callback, persistence, archive, retention, AI-send, or live pilot behavior appears, disable `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW` immediately and keep the build blocked for investigation.
