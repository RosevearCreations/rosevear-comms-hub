# QL-086 Ops Checklist — Public Disabled Preview Synthetic Conversation Detail Tabs Implementation

## Public preview check

Open:

`https://rosevearcreations.github.io/rosevear-comms-hub/`

Confirm:

- Floating Interface Preview shows `QL-086`.
- Rosie Dazzlers / Devil n Dove brand switcher still works.
- Synthetic conversation selector still works.
- Overview, Draft, Timeline, and Safety tabs are clickable.
- Tab content changes only inside the public preview.
- Locked action buttons remain disabled.

## Supabase project target

Recorded future database/functions project:

`https://gxujcwpktaickcgzyvnu.supabase.co`

QL-086 must not use this target for runtime reads, writes, migrations, or Edge Functions.

## Blocked runtime confirmation

Confirm QL-086 does not enable:

- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Calls.
- Recordings.
- AI reply generation or sending.
- Persistence writes.
- Live customer reads or writes.
- Archive writes.
- Retention writes.
- Provider inbox reads.
- Callback payload reads.
- Supabase runtime access.
- Supabase migrations.
- Supabase Edge Functions.
- Live pilot runtime.

## Green promotion checks

- Feature PR CI passes install/check/build.
- `dev → main` promotion PR CI passes install/check/build.
- Final `main` App scaffold CI passes.
- Final GitHub Pages Disabled Preview build/deploy passes.
