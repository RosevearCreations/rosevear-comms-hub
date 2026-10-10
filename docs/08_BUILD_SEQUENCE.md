# 08 — Build Sequence

This file tracks the completed Quo-lite build path and the next queued build.

## Completed builds

- QL-001 through QL-083 — complete. Earlier completed-build details are preserved in the repository history.
- QL-084 — Phone/SMS Controlled Live Enablement Live-Pilot Public Disabled Preview Synthetic Conversation Selector Review — complete.
- QL-085 — Phone/SMS Controlled Live Enablement Live-Pilot Public Disabled Preview Synthetic Conversation Detail Tabs Plan — complete.
- QL-086 — Phone/SMS Controlled Live Enablement Live-Pilot Public Disabled Preview Synthetic Conversation Detail Tabs Implementation — complete.

## QL-087 — Phone/SMS Controlled Live Enablement Live-Pilot Public Disabled Preview Synthetic Conversation Detail Tabs Review

Status: complete.

Result:

- Reviewed the QL-086 browser-local detail-tab implementation.
- Confirmed Overview, Draft, Timeline, and Safety tabs remain understandable and visually clear.
- Confirmed active tab state remains React state only and resets on reload.
- Confirmed brand switching and conversation selection remain browser-local.
- Updated the floating interface preview to show QL-087 review and infrastructure-readiness state.
- Recorded GitHub Pages as the current green public preview: `https://rosevearcreations.github.io/rosevear-comms-hub/`.
- Recorded the connected Cloudflare Worker target: `https://rosevear-comms-hub.jfrosevear.workers.dev/`.
- Added root `package.json` with Cloudflare build/deploy scripts.
- Added `wrangler.jsonc` for Cloudflare Worker static assets with `./app/dist` and SPA fallback.
- Added root `supabase/` folder for Supabase GitHub integration.
- Added `supabase/config.toml` for project `gxujcwpktaickcgzyvnu`.
- Added safe synthetic-data migration `supabase/migrations/20261010154500_ql087_app_foundation.sql`.
- Added Supabase `ql-status` Edge Function scaffold.
- Added QL-087 readiness guard at `api/deployment/phoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewSyntheticConversationDetailTabsReview.ts`.
- Added QL-087 contract fixture at `api/contracts/phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-synthetic-conversation-detail-tabs-review.example.json`.
- Added source-of-truth doc, build record, ops checklist, remote-operator note, and telephony boundary note.
- Confirmed Supabase dashboard integration should use working directory `.` and production branch `main` after QL-087 reaches `main`.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-088 — Phone/SMS Controlled Live Enablement Live-Pilot Cloudflare and Supabase Live Readiness Review

Goal:

- Verify Cloudflare Worker static-assets deployment from the connected GitHub repo.
- Verify Supabase GitHub integration can read the root `supabase/` folder.
- Verify Supabase migration/function deployment results in the dashboard.
- Verify `ql-status` function reachability if Supabase deploys it successfully.
- Keep all Phone/SMS/provider/live-customer/archive/retention/live-pilot runtime disabled until the infrastructure is proven safe.
- Decide whether the app can begin a browser-safe Supabase read-only client integration next.
