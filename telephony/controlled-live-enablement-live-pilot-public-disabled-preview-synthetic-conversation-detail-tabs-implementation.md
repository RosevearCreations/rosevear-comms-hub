# Telephony Boundary — QL-086 Public Disabled Preview Synthetic Conversation Detail Tabs Implementation

QL-086 is not a telephony enablement build.

It implements browser-local detail tabs for hard-coded synthetic conversations in the public disabled preview.

## Allowed

- Browser-local active tab state.
- Browser-local brand state.
- Browser-local synthetic conversation selection.
- Hard-coded sample data.
- Static safety explanations.
- Public GitHub Pages disabled preview rendering.

## Recorded future target

The rosevearcreations Supabase project URL is recorded for later database/functions work:

`https://gxujcwpktaickcgzyvnu.supabase.co`

QL-086 does not connect to it.

## Blocked

- Live phone webhooks.
- Provider callbacks.
- SMS sending.
- Call placement.
- Call recording.
- Provider inbox reads.
- Callback payload reads.
- Live customer reads or writes.
- Persistence writes.
- Archive writes.
- Retention writes.
- Supabase runtime reads.
- Supabase runtime writes.
- Supabase migrations.
- Supabase Edge Functions.
- AI reply generation.
- AI send.
- Live pilot runtime.

## Next permitted build

QL-087 may review the browser-local detail tabs implementation only. It must not activate Phone/SMS or Supabase runtime paths.
