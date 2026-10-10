# QL-086 — Public Disabled Preview Synthetic Conversation Detail Tabs Implementation

## Purpose

QL-086 implements the public disabled preview detail tabs planned in QL-085.

The implementation is intentionally limited to browser-local React state and hard-coded synthetic conversation data.

## Public preview

- Public URL: `https://rosevearcreations.github.io/rosevear-comms-hub/`
- Vite base path: `/rosevear-comms-hub/`
- Visible build label: `QL-086`

## Implemented local-only interactions

QL-086 keeps these existing browser-local controls active:

- Rosie Dazzlers / Devil n Dove brand switcher.
- Hard-coded synthetic conversation selector.

QL-086 adds this new browser-local control:

- Detail tab switching for the selected synthetic conversation.

The implemented tabs are:

1. Overview — selected summary, status, brand, and source note.
2. Draft — draft-only response copy.
3. Timeline — synthetic timeline events.
4. Safety — locked-runtime reminders and source restrictions.

## Supabase target record

The rosevearcreations Supabase project URL is recorded for future database and functions work:

`https://gxujcwpktaickcgzyvnu.supabase.co`

QL-086 does not use this URL for runtime data access. It does not add Supabase reads, writes, migrations, or Edge Functions.

## State model

- Brand switch state: browser-local React state only.
- Conversation selector state: browser-local React state only.
- Active tab state: browser-local React state only.
- Persistence: none.
- Reload behavior: preview state resets on page reload.

## Runtime boundary

QL-086 keeps all of the following disabled:

- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Recording runtime.
- AI reply generation.
- AI send.
- Persistence writes.
- Live customer reads or writes.
- Archive writes.
- Retention writes.
- Provider inbox reads.
- Callback payload reads.
- Supabase runtime reads or writes.
- Supabase migrations.
- Supabase Edge Functions.
- Vercel deployment.
- Cloudflare Pages deployment.
- Live pilot runtime.

## Review exit criteria

QL-086 is ready for QL-087 review when:

- The four tabs switch correctly for the selected synthetic conversation.
- Brand switching remains local.
- Conversation selection remains local.
- Tab state remains local.
- Tab content uses only hard-coded synthetic fields.
- Locked live actions remain disabled.
- App scaffold CI passes.
- GitHub Pages Disabled Preview builds and deploys successfully.
