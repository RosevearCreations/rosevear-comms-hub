# QL-091 Ops Checklist — Browser-Safe Supabase Read-Only Client Review

## Public disabled preview checks

- Confirm the public preview remains disabled and non-mutating.
- Confirm hard-coded local synthetic fallback samples remain available.
- Confirm the review evidence module does not enable runtime reads by itself.

## Supabase checks

- Confirm expected project URL: `https://gxujcwpktaickcgzyvnu.supabase.co`.
- Confirm reads require `VITE_SUPABASE_URL`.
- Confirm reads require `VITE_SUPABASE_ANON_KEY`.
- Confirm reads require `VITE_QL_ENABLE_SUPABASE_READS=true`.
- Confirm unexpected project URLs are blocked before client creation.
- Confirm allowed read-only views remain `ql_public_synthetic_conversations` and `ql_public_system_status`.

## Blocked paths

- No live customer reads.
- No provider payload reads.
- No database writes.
- No phone/SMS runtime.
- No callback registration.
- No archive writes.
- No retention writes.
- No AI send.
- No live pilot runtime.

## Promotion checks

- Feature PR to `dev` must pass App scaffold CI.
- `dev` to `main` promotion PR must pass App scaffold CI.
- Final `main` must pass App scaffold CI, Supabase Preview, GitHub Pages disabled preview, and Cloudflare Worker build.
