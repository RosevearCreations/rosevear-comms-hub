# QL-088 Remote Operator Note

Use this note when reviewing the public disabled preview after QL-088 reaches `main`.

## Expected UI

- Floating preview badge shows `QL-088`.
- Header says Cloudflare and Supabase readiness review.
- Brand switcher remains interactive and browser-local.
- Synthetic conversation selector remains interactive and browser-local.
- Detail tabs remain Overview, Draft, Timeline, and Safety.
- Safety tab names Cloudflare Worker readiness and Supabase scaffold readiness.

## Expected infrastructure checks

- GitHub App scaffold CI succeeds.
- Cloudflare Worker check succeeds on final `main`.
- Supabase integration can be reviewed in the Supabase dashboard with working directory `.` and branch `main`.

## Explicit non-goals

QL-088 does not send messages, place calls, read live customer records, write archives, write retention records, connect providers, or enable live pilot runtime.
