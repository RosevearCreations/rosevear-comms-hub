# 08 — Build Sequence

This file is the build-sequence entry point. The active future batch is listed below;
older completed-build history and former queues remain preserved for reference.

## Current active queue — QL-290 through QL-304

**Latest verified production release:** QL-296 at exact `main` code commit
`ea2200a9bf579a730cecde3118ab493e94cd30a4` (five production checks GREEN;
live JS/CSS SHA-256 matching the tested bundle).

**15 builds are in the active batch; 7/15 Production GREEN; 8 remain.**
Next is **QL-297 — Omnichannel Event Timeline Simulator, Delivery Error States & Replay Recovery.** Follow the full, numbered feature scope, dependencies, test
evidence and queue-count rules in **[QL-290–304 Required Build Queue](QL-290-304-REQUIRED_BUILD_QUEUE.md)**.

| Builds | Priority area | Count |
| --- | --- | ---: |
| QL-290 | Reviewer/custodian proof preconditions and six-source priority exceptions | 1 |
| QL-291–294 | Operator usability: modern command cards, inbox, draft recovery and task shortcuts | 4 |
| QL-295–298 | Communications: contact context, four-business intake, mock event timeline and IVR scenarios | 4 |
| QL-299–300 | Accessibility owner walkthrough, keyboard preferences and saved-view recovery | 2 |
| QL-301–302 | Management/Status dashboards and source-explained statistics | 2 |
| QL-303–304 | Six-app safe integration readiness and end-to-end synthetic acceptance/queue closure | 2 |
| **Total** | **Active planned batch** | **15** |

**Scope restriction:** these are planned software improvements, **not** live
provider or owner-evidence authorizations. The Six-App Acknowledgement Delivery
Evidence workstream remains **UNDER_REVIEW / PARKED_FOR_LATER**, outside this
active queue. All six integrations remain **DISCONNECTED / HOLD**, and real
calls/SMS, source gateway GETs, private receipts and customer-data writes stay
disabled pending genuine independent verification and separate TEST approval.

### Archived queues

- [QL-164–170 Required Build Queue](QL-164-170-REQUIRED_BUILD_QUEUE.md)
- [QL-171–182 Required Build Queue](QL-171-182-REQUIRED_BUILD_QUEUE.md)

The archived QL-166/QL-167–170 status and history belong to those older batches;
they are not active future builds as of QL-290.

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
- Added a QL-091 Cloudflare redeploy trigger note after the first QL-091 `main` promotion did not receive a Worker check-run.
- Verified the final QL-091 production commit with App CI, Supabase Preview, and `Workers Builds: rosevear-comms-hub` green.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-092 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Safe Read Implementation Plan

Status: complete.

Result:

- Planned the first visible safe-read implementation for the public disabled preview without enabling runtime Supabase hydration in this build.
- Added app-side planning evidence at `app/src/operator/ql092SafeReadImplementationPlan.ts`.
- Confirmed the existing QL-090/QL-091 env, expected-project, anon-key, read-enable, and fallback gates remain unchanged.
- Confirmed future safe reads remain limited to `public.ql_public_synthetic_conversations` and `public.ql_public_system_status`.
- Defined payload validation rules for synthetic conversation rows and system status rows before any remote data can hydrate display-only UI state.
- Defined discard/fallback behavior for unknown brand ids, unknown sample ids, unexpected row shapes, oversized display strings, live/provider/admin/archive/retention fields, read errors, and disabled gates.
- Added QL-092 deployment guard at `api/deployment/phoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewBrowserSafeSupabaseReadOnlyClientSafeReadImplementationPlan.ts`.
- Added QL-092 contract fixture at `api/contracts/phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-browser-safe-supabase-read-only-client-safe-read-implementation-plan.example.json`.
- Added source documentation, build record, ops checklist, remote-operator note, and telephony boundary note.
- Kept provider callbacks, live phone webhooks, SMS sending, call runtime, call recording, AI auto-send, live customer reads/writes, provider delivery, archive writes, retention writes, provider account connection, provider live-number attachment, callback registration, and live pilot runtime disabled.

## QL-093 — Public Disabled Preview Validated Synthetic Safe Reads Implementation

Goal:

- Implement validated synthetic safe reads behind the existing `VITE_QL_ENABLE_SUPABASE_READS=true` gate.
- Keep local synthetic samples as initial state and fallback state.
- Hydrate display-only preview state only from validated rows in the two approved public synthetic views.
- Surface active source and fallback reason without enabling browser writes or live communications.
- Keep live customer data, provider payloads, SMS/call events, archives, retention records, writes, AI send, and live pilot runtime out of scope.
- Verify App CI, Supabase Preview, Cloudflare Worker build, and any public preview deployment checks before promotion.
