# QL-093 — Public Disabled Preview Validated Synthetic Safe Reads Implementation

## Purpose

QL-093 implements the first browser-visible safe-read path for the public disabled preview. It keeps the public preview local and synthetic by default, then attempts Supabase reads only when the existing QL-090 gates permit a browser-safe anon-key client.

## Read gates

The browser client still requires all of the following before any Supabase read can run:

- `VITE_SUPABASE_URL` is present.
- `VITE_SUPABASE_URL` exactly matches `https://gxujcwpktaickcgzyvnu.supabase.co`.
- `VITE_SUPABASE_ANON_KEY` is present.
- `VITE_QL_ENABLE_SUPABASE_READS=true` is present.
- Auth persistence, token refresh, URL session detection, and browser writes remain disabled.

## Approved sources

QL-093 only attempts display-only reads from:

- `public.ql_public_synthetic_conversations`
- `public.ql_public_system_status`

No live contacts, conversations, messages, phone calls, SMS messages, provider payloads, consent logs, app admins, audit events, archives, or retention records can hydrate the preview.

## Validation

Conversation rows must pass all of these checks before display:

- Required fields: `id`, `brand_id`, `brand_name`, `title`, `status`, `summary`, `draft`, and `created_at`.
- No unexpected keys and no blocked live/private keys.
- Brand id maps to an approved public disabled-preview brand alias.
- Row brand matches the selected preview brand.
- String values are present and bounded for UI display.
- `created_at` parses as a date.
- Status text does not imply live SMS/call/provider/callback/archive/retention/send runtime.

System rows must pass all of these checks before display:

- Required fields: `id`, `label`, `status`, `detail`, and `created_at`.
- No unexpected keys and no blocked live/private keys.
- Status is one of `ready`, `blocked`, or `planned`.

## Fallback behavior

- Missing env, unexpected project URL, disabled read flag, failed reads, empty reads, malformed rows, unknown brands, or unsafe fields keep the local fallback rows visible.
- Partial valid reads can display the valid surface while the other surface stays on local fallback rows.
- Rejected row reasons are displayed as bounded diagnostics only; raw payloads are not exposed.

## User-visible implementation

QL-093 adds:

- `app/src/operator/ql093ValidatedSyntheticSafeReads.ts` for guarded loading and validation.
- `app/src/operator/Ql093SafeReadPreview.tsx` for the display-only safe-read preview panel.
- `app/src/operator/ql093-safe-read-preview.css` for the QL-093 panel styling.
- `api/deployment/phoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewValidatedSyntheticSafeReadsImplementation.ts` as the deployment guard.
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-validated-synthetic-safe-reads-implementation.example.json` as the contract fixture.

## Locked runtime boundary

QL-093 does not enable:

- Browser writes, inserts, updates, deletes, RPC mutations, storage uploads, or session persistence.
- Live customer/contact/conversation/message/provider payload rows.
- Phone/SMS providers, callbacks, live calls, SMS sending, recordings, archive writes, retention writes, consent writes, audit writes, or admin runtime.
- AI generation, AI sending, provider delivery, callback registration, or live pilot runtime.

## Verification target

Before production GREEN:

- App scaffold CI passes install/check/build.
- Supabase Preview passes.
- Cloudflare Worker build posts and passes on final `main`.
- GitHub Pages checks are observed when they post for the final commit.
