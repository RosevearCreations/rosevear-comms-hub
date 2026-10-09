# QL-071 — GitHub Pages Disabled Preview Deployment Plan Ops Checklist

## Objective

Plan the GitHub Pages static disabled preview deployment path without enabling deployment or live Phone/SMS runtime.

## Operator checks

- Target URL confirmed: `https://rosevearcreations.github.io/rosevear-comms-hub/`.
- GitHub Pages source will be GitHub Actions only after the later enablement build adds a workflow.
- Static app base path planned as `/rosevear-comms-hub/`.
- Public browser variables limited to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Service-role keys and provider secrets remain server-only later.
- Phone/SMS provider callbacks remain disabled.
- Live phone webhooks remain disabled.
- SMS sending remains disabled.
- Call runtime and recording remain disabled.
- AI draft/auto-send runtime remains disabled.
- Persistence writes remain disabled.
- Archive and retention writes remain disabled.
- Live pilot runtime remains disabled.

## Manual setup steps for later enablement

1. GitHub → `RosevearCreations/rosevear-comms-hub`.
2. Settings → Pages.
3. Build and deployment → Source → GitHub Actions.
4. Settings → Secrets and variables → Actions → Variables.
5. Add `VITE_SUPABASE_URL` only if required for static preview.
6. Add `VITE_SUPABASE_ANON_KEY` only if required for static preview.
7. Do not add `SUPABASE_SERVICE_ROLE_KEY`, provider credentials, webhook signing secrets, callback tokens, live phone numbers, transcripts, recordings, or live customer data to browser variables.

## QL-071 result

Plan only. No deployment is enabled in this build.
