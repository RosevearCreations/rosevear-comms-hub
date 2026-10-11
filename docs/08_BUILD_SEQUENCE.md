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
- Re-deployed the Worker static-assets path through the newly connected Cloudflare project for `devilndovelive@gmail.com` without changing app runtime.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-088 — Phone/SMS Controlled Live Enablement Live-Pilot Cloudflare and Supabase Live Readiness Review

Status: complete.

Result:

- Updated the floating interface preview to show QL-088 Cloudflare and Supabase live-readiness review state.
- Removed the old Cloudflare account URL reference from the preview and replaced it with the connected `devilndovelive@gmail.com` Worker target label.
- Confirmed the trusted Cloudflare signal is the GitHub check named `Workers Builds: rosevear-comms-hub` on final `main`.
- Reconfirmed Supabase target project: `https://gxujcwpktaickcgzyvnu.supabase.co`.
- Reconfirmed Supabase GitHub integration settings: repository `RosevearCreations/rosevear-comms-hub`, working directory `.`, production branch `main`.
- Confirmed the root `supabase/` scaffold remains the safe database/function testing boundary.
- Queried the Supabase migration history and adopted existing remote migration versions `20261003185837`, `20261003185925`, `20261003233600`, and `20261003233636` into local migration-history files so the GitHub integration can reconcile remote history.
- Added QL-088 readiness guard at `api/deployment/phoneSmsControlledLiveEnablementLivePilotCloudflareSupabaseLiveReadinessReview.ts`.
- Added QL-088 contract fixture at `api/contracts/phone-sms-controlled-live-enablement-live-pilot-cloudflare-supabase-live-readiness-review.example.json`.
- Added source documentation, build record, ops checklist, remote-operator note, and telephony boundary note.
- Decided the next safe application step is planning a browser-safe Supabase read-only client integration.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-089 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Plan

Status: complete.

Result:

- Updated the floating interface preview to show QL-089 browser-safe Supabase read-only client planning state.
- Confirmed QL-089 is plan-only and does not instantiate a Supabase browser client.
- Confirmed no `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is consumed by runtime code in this build.
- Identified allowed future read-only sources: synthetic public conversation view/RPC output, synthetic public status view/RPC output, and the existing `ql-status` style function output.
- Blocked browser reads from contacts, conversations, messages, phone calls, SMS messages, consent logs, app admins, audit events, archives, retention records, provider payloads, and live customer records.
- Defined fallback behavior for missing environment variables, failed reads, and unexpected remote payloads.
- Added QL-089 readiness guard at `api/deployment/phoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewBrowserSafeSupabaseReadOnlyClientPlan.ts`.
- Added QL-089 contract fixture at `api/contracts/phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-browser-safe-supabase-read-only-client-plan.example.json`.
- Added source documentation, build record, ops checklist, remote-operator note, and telephony boundary note.
- Decided the next safe application step is a browser-safe Supabase read-only client scaffold that falls back to local samples by default.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-090 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Scaffold

Status: complete.

Result:

- Added `app/src/integrations/supabaseReadOnlyClient.ts` as the browser-safe Supabase read-only scaffold.
- Added env typing for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_QL_ENABLE_SUPABASE_READS`.
- Required the expected project URL `https://gxujcwpktaickcgzyvnu.supabase.co` before creating any browser client.
- Required the explicit read-enable flag `VITE_QL_ENABLE_SUPABASE_READS=true` before creating the anon-key client.
- Added read functions limited to `public.ql_public_synthetic_conversations` and `public.ql_public_system_status`.
- Added Supabase migration `20261010205200_ql090_public_read_only_views.sql` for synthetic public read-only views.
- Updated the floating public disabled preview to show QL-090 scaffold status, env gating, allowed sources, blocked sources, and fallback rules.
- Added QL-090 readiness guard at `api/deployment/phoneSmsControlledLiveEnablementLivePilotBrowserSafeSupabaseReadOnlyClientScaffold.ts`.
- Added QL-090 contract fixture at `api/contracts/phone-sms-controlled-live-enablement-live-pilot-browser-safe-supabase-read-only-client-scaffold.example.json`.
- Added source documentation, build record, ops checklist, remote-operator note, and telephony boundary note.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-091 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Review

Status: complete.

Result:

- Reviewed `app/src/integrations/supabaseReadOnlyClient.ts` without enabling additional runtime behavior.
- Added app-side review evidence at `app/src/operator/ql091ReadOnlyClientReview.ts` so the public-preview app build path validates the review boundary.
- Confirmed browser client creation remains disabled unless `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_QL_ENABLE_SUPABASE_READS=true` are all present.
- Confirmed `VITE_SUPABASE_URL` must match `https://gxujcwpktaickcgzyvnu.supabase.co` before any client can be created.
- Confirmed auth persistence, auto refresh, and URL session detection remain disabled for the preview client.
- Confirmed allowed read-only sources remain limited to `public.ql_public_synthetic_conversations` and `public.ql_public_system_status`.
- Confirmed blocked browser sources still include contacts, conversations, messages, phone calls, SMS messages, provider payloads, consent logs, app admins, audit events, archives, and retention records.
- Confirmed fallback behavior remains local synthetic samples whenever env gates, project gate, read policy, or payload checks fail.
- Added QL-091 review guard at `api/deployment/phoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewBrowserSafeSupabaseReadOnlyClientReview.ts`.
- Added QL-091 contract fixture at `api/contracts/phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-browser-safe-supabase-read-only-client-review.example.json`.
- Added source documentation, build record, ops checklist, remote-operator note, and telephony boundary note.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-092 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Safe Read Implementation Plan

Goal:

- Plan the first visible safe-read implementation for the public disabled preview.
- Keep the safe-read target limited to synthetic public views only.
- Keep local synthetic samples as the default fallback when env variables are missing, reads fail, or payloads are unexpected.
- Define payload validation before any remote rows can hydrate UI state.
- Keep live customer data, provider payloads, SMS/call events, archives, retention records, writes, AI send, and live pilot runtime out of scope.
- Verify App CI, Supabase Preview, Cloudflare Worker build, and any public preview deployment checks before promotion.
