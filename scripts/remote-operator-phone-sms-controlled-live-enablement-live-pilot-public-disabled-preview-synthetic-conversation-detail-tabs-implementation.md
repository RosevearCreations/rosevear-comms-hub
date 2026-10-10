# Remote Operator Note — QL-086 Detail Tabs Implementation

## What changed

QL-086 implements local detail tabs in the public disabled preview.

The active tabs are:

- Overview.
- Draft.
- Timeline.
- Safety.

These tabs are local React state only. They do not read or write Supabase, providers, customer records, messages, calls, recordings, archives, retention records, or AI outputs.

## What to test visually

1. Open the public preview.
2. Open the floating Interface Preview.
3. Switch between Rosie Dazzlers and Devil n Dove.
4. Select different hard-coded synthetic conversations.
5. Click Overview, Draft, Timeline, and Safety.
6. Confirm the displayed content changes locally.
7. Confirm locked actions remain disabled.

## Supabase note

Future database/functions target:

`https://gxujcwpktaickcgzyvnu.supabase.co`

Do not add Supabase access during QL-086.

## Do not enable

- SMS sending.
- Calls.
- Provider callbacks.
- Live customer reads.
- Supabase runtime reads/writes.
- Supabase migrations.
- Supabase Edge Functions.
- AI reply generation.
- AI send.
- Persistence writes.
- Archive/retention writes.
- Live pilot runtime.
