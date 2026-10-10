# QL-089 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Plan

## Purpose

QL-089 plans the first browser-safe Supabase read-only client path for the public disabled preview. It does not implement the Supabase browser client yet.

The purpose is to define the exact safe boundary before a later build starts reading any data from Supabase in the browser.

## Current runtime state

The public disabled preview remains hard-coded and synthetic.

- No Supabase browser client is instantiated.
- No anon key is read by application code.
- No database query runs from the browser.
- No Edge Function request runs from the browser.
- No live Phone/SMS/provider runtime is enabled.

## Supabase target

Project URL:

```text
https://gxujcwpktaickcgzyvnu.supabase.co
```

GitHub integration target:

```text
Repository: RosevearCreations/rosevear-comms-hub
Working directory: .
Production branch: main
```

## Allowed future read-only sources

A future implementation may read only from intentionally public-safe synthetic outputs:

- `public.ql_public_synthetic_conversations` view or equivalent RPC output containing synthetic sample rows only.
- `public.ql_public_system_status` view or equivalent `ql-status` function output containing non-secret readiness details only.
- No live customer, provider, admin, archive, or retention data.

## Blocked sources

The browser preview must not read from these sources:

- `contacts`
- `conversations`
- `messages`
- `phone_calls`
- `sms_messages`
- `consent_logs`
- `app_admins`
- `audit_events`
- archives
- retention records
- provider payloads
- live customer records

## Environment and fallback plan

Future implementation must preserve these fallbacks:

1. Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` keeps hard-coded samples.
2. Failed reads keep hard-coded samples.
3. Unexpected columns or live-customer-like payloads are rejected and local samples stay visible.
4. The UI shows a non-blocking read-only unavailable badge rather than failing the preview.

## QL-090 implementation gate

QL-090 may scaffold the browser-safe read-only client only if:

- QL-089 is green on `main`.
- Supabase Preview remains green.
- Cloudflare Worker build remains green.
- The client uses anon-key boundaries only.
- The first read path is synthetic-only.
- No mutation helper, insert, update, delete, RPC write, provider send, archive write, retention write, or live pilot action is introduced.

## Locked runtime

Provider callbacks, live phone webhooks, SMS sending, call runtime, recordings, AI sending, live customer reads/writes, archive writes, retention writes, provider live-number attachment, callback registration, and live pilot runtime remain disabled.
