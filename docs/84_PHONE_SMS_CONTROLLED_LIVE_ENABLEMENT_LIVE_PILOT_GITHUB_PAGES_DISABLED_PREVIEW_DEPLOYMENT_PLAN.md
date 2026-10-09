# QL-071 — Phone/SMS Controlled Live Enablement Live-Pilot GitHub Pages Disabled Preview Deployment Plan

## Status

Complete when promoted to `main` with the app scaffold CI green.

## Purpose

QL-071 plans the GitHub Pages static disabled preview deployment path for the Quo-lite operator interface. It does not deploy the interface. It prepares the target URL, browser-safe variable boundary, manual setup steps, and the next controlled enablement gate.

## Target review URL

Planned URL:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

This URL is not live in QL-071. A later enablement build must add the GitHub Pages workflow and then the repository must use GitHub Actions as the Pages source.

## Planned static deployment boundary

- Static host candidate: GitHub Pages.
- Planned app base path: `/rosevear-comms-hub/`.
- Planned artifact source: app static build output.
- Planned review mode: disabled preview only.
- Planned browser variables: only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Planned server-only secrets: service-role keys, provider credentials, webhook signing secrets, callback tokens, phone/SMS secrets, and any live-customer evidence.

## Manual setup plan

1. Open GitHub repository `RosevearCreations/rosevear-comms-hub`.
2. Open **Settings**.
3. Open **Pages**.
4. In **Build and deployment**, choose **Source: GitHub Actions** only when the later enablement build adds the workflow.
5. Open **Settings → Secrets and variables → Actions → Variables**.
6. Add `VITE_SUPABASE_URL` only if the static preview needs the public Supabase project URL.
7. Add `VITE_SUPABASE_ANON_KEY` only if the static preview needs the public anon key.
8. Do **not** add service-role keys, provider credentials, webhook signing secrets, callback tokens, live phone numbers, live customer records, live message bodies, transcripts, recordings, or archive material to browser variables.
9. After the later enablement build deploys, review the target public URL as a static disabled preview only.

## Explicitly not enabled in QL-071

- No GitHub Pages workflow.
- No GitHub Pages deployment.
- No GitHub Pages source setting change.
- No Vercel.
- No Cloudflare Pages.
- No Supabase migration.
- No Supabase Edge Function.
- No provider account connection.
- No live-number attachment.
- No callback route registration.
- No provider webhook.
- No SMS sending.
- No call runtime.
- No recording.
- No AI send.
- No persistence write.
- No live customer read or write.
- No archive write.
- No retention policy write.
- No live pilot runtime.

## QL-071 decision

QL-071 approves only the next safe step:

```text
QL-072-phone-sms-controlled-live-enablement-live-pilot-github-pages-disabled-preview-deployment-enablement-gate
```

That next build may add the static GitHub Pages preview workflow only if it keeps the interface disabled, browser-safe, review-only, and free of live Phone/SMS runtime paths.
