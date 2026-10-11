# Remote Operator Note — QL-091 Browser-Safe Supabase Read-Only Client Review

QL-091 is a review build for the QL-090 Supabase read-only scaffold.

## What to verify visually

- The public disabled preview still opens normally.
- The interface still communicates that live communication actions are locked.
- The Supabase read-only gate remains visible in the preview from QL-090.
- Local synthetic fallback samples remain the safe default.

## What not to enable

Do not enable phone/SMS providers, callback URLs, live phone numbers, live customer reads, provider payload reads, archive writes, retention writes, AI send actions, or live pilot runtime as part of QL-091.

## Expected environment behavior

The scaffold can only create a browser client when all of the following are true:

- `VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co`
- `VITE_SUPABASE_ANON_KEY` is present
- `VITE_QL_ENABLE_SUPABASE_READS=true`

Without those values, fallback local samples remain active.
