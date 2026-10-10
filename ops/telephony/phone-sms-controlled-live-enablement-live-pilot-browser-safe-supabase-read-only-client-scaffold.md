# QL-090 Ops Checklist — Browser-Safe Supabase Read-Only Client Scaffold

## Expected green checks

- App scaffold CI passes install/check/build.
- Supabase Preview passes migration application.
- GitHub Pages disabled preview build/deploy passes.
- Cloudflare Worker build passes.

## Browser-safe env gate

The scaffold must remain inactive unless all are true:

- `VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co`
- `VITE_SUPABASE_ANON_KEY` is present
- `VITE_QL_ENABLE_SUPABASE_READS=true`

## Allowed reads

- `public.ql_public_synthetic_conversations`
- `public.ql_public_system_status`

## Blocked paths

- live customer data
- provider payloads
- phone/SMS events
- admin/audit tables
- archives and retention records
- all writes and mutations
- live pilot runtime

## Manual review

Open the floating interface preview and confirm QL-090 shows scaffold state, fallback messaging, allowed sources, blocked sources, and locked live actions.
