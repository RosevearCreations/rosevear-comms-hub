# Remote Operator Checklist — QL-071 GitHub Pages Disabled Preview Deployment Plan

## What QL-071 does

QL-071 records the plan for a GitHub Pages static disabled preview. It confirms the target URL and the browser-safe variable boundary.

## What QL-071 does not do

- Does not add a GitHub Pages workflow.
- Does not deploy the app to GitHub Pages.
- Does not change repository Pages settings.
- Does not add Vercel or Cloudflare Pages.
- Does not add Supabase migrations or Edge Functions.
- Does not enable provider callbacks, live phone webhooks, SMS sending, calls, recording, AI send, persistence writes, archive writes, retention writes, or live pilot runtime.

## Future manual setup

When the later enablement build is ready:

1. Open GitHub repository `RosevearCreations/rosevear-comms-hub`.
2. Open **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Open **Settings → Secrets and variables → Actions → Variables**.
5. Add only the public browser variables needed by the static preview:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Never place service-role keys, provider credentials, callback tokens, webhook signing secrets, live phone numbers, message bodies, transcripts, recordings, or live customer data in browser variables.

## Planned review URL

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

This URL is still not live in QL-071.
