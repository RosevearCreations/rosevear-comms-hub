# QL-090 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Scaffold

QL-090 adds the first browser-safe Supabase read-only client scaffold for the public disabled preview.

## What changed

- Added `app/src/integrations/supabaseReadOnlyClient.ts`.
- Added explicit Vite env typing for Supabase read-only preview values.
- Added a read-only client gate that checks:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_QL_ENABLE_SUPABASE_READS=true`
  - expected project URL `https://gxujcwpktaickcgzyvnu.supabase.co`
- Added public read-only Supabase views:
  - `public.ql_public_synthetic_conversations`
  - `public.ql_public_system_status`
- Updated the floating public disabled preview to show QL-090 scaffold status, allowed sources, blocked sources, and fallback behavior.

## Allowed browser sources

The QL-090 scaffold allows only these read targets:

- `public.ql_public_synthetic_conversations`
- `public.ql_public_system_status`

These views expose synthetic samples and non-secret readiness status only.

## Blocked browser sources

The browser preview must not read these source families:

- contacts
- conversations
- messages
- phone calls
- SMS messages
- provider payloads
- consent logs
- app admins
- audit events
- archives
- retention records

## Fallback rules

The preview must keep local synthetic samples when:

- required env values are missing,
- `VITE_QL_ENABLE_SUPABASE_READS` is not `true`,
- the configured Supabase URL does not match the expected project,
- Supabase read access fails,
- returned payloads do not match the expected synthetic shape.

## Safety boundary

QL-090 does not enable writes, live customer reads, provider payload reads, phone runtime, SMS runtime, archive writes, retention writes, AI sending, or live pilot runtime.

## Next build

QL-091 should review the read-only scaffold and verify the browser/env/status behavior before any wider use.
