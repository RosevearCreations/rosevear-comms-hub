# QL-091 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Review

## Purpose

QL-091 reviews the QL-090 browser-safe Supabase read-only client scaffold before any safe-read implementation is allowed to advance.

This build is review-only. It does not add new database reads, writes, provider callbacks, phone/SMS runtime, archive writes, retention writes, AI send behavior, or live pilot runtime.

## Reviewed scaffold

The reviewed scaffold is `app/src/integrations/supabaseReadOnlyClient.ts`.

It may create a browser Supabase client only when all gates pass:

1. `VITE_SUPABASE_URL` is present.
2. `VITE_SUPABASE_URL` exactly equals `https://gxujcwpktaickcgzyvnu.supabase.co`.
3. `VITE_SUPABASE_ANON_KEY` is present.
4. `VITE_QL_ENABLE_SUPABASE_READS=true` is present.

If any gate fails, the public disabled preview stays on local synthetic fallback samples.

## Allowed read-only sources

The only approved read-only targets are:

- `public.ql_public_synthetic_conversations`
- `public.ql_public_system_status`

These are synthetic public views created for disabled-preview testing.

## Blocked browser sources

The browser scaffold must not read from live or private sources, including contacts, conversations, messages, phone calls, SMS messages, provider payloads, consent logs, app admins, audit events, archives, or retention records.

## Fallback review

QL-091 confirms these fallback rules remain required:

- Missing env values keep local synthetic samples.
- Disabled read flag keeps local synthetic samples.
- Unexpected project URL blocks client creation.
- Read errors keep local synthetic samples.
- Unexpected payloads must be rejected in a future implementation and local samples preserved.

## Safety boundary

The following remain disabled:

- Database writes
- Live customer reads
- Provider payload reads
- Phone/SMS runtime
- Callback registration
- Archive writes
- Retention writes
- AI send actions
- Live pilot runtime

## Review outcome

QL-091 approves review-only readiness and queues QL-092 as a planning build for a safe-read implementation path. QL-092 must still remain public disabled preview, synthetic-only, and non-mutating.
