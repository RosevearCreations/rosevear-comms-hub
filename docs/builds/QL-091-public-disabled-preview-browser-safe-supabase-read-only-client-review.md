# QL-091 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Review

Status: in promotion

## Summary

QL-091 reviews the QL-090 browser-safe Supabase read-only client scaffold and confirms it remains disabled by default, synthetic-source-only, and non-mutating.

## Review findings

- The Supabase wrapper requires the expected project URL before client creation.
- The Supabase wrapper requires an anon key before client creation.
- The Supabase wrapper requires `VITE_QL_ENABLE_SUPABASE_READS=true` before client creation.
- Auth persistence, auto refresh, and session detection are disabled for the preview client.
- Read helpers are limited to `ql_public_synthetic_conversations` and `ql_public_system_status`.
- The UI retains hard-coded local synthetic fallback samples.
- Live/customer/provider/admin/archive/retention sources remain blocked.
- Writes and live communications remain disabled.

## Changed files

- `app/src/operator/ql091ReadOnlyClientReview.ts`
- `api/deployment/phoneSmsControlledLiveEnablementLivePilotPublicDisabledPreviewBrowserSafeSupabaseReadOnlyClientReview.ts`
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-public-disabled-preview-browser-safe-supabase-read-only-client-review.example.json`
- `docs/104_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_PUBLIC_DISABLED_PREVIEW_BROWSER_SAFE_SUPABASE_READ_ONLY_CLIENT_REVIEW.md`
- `docs/08_BUILD_SEQUENCE.md`
- Ops, remote-operator, and telephony boundary notes

## Verification target

- App scaffold CI install/check/build
- Supabase Preview
- GitHub Pages disabled preview build/deploy
- Cloudflare Worker build

## Next build

QL-092 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Safe Read Implementation Plan
