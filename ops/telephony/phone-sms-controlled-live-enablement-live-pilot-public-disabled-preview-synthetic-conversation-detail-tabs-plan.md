# QL-085 Ops Checklist — Synthetic Conversation Detail Tabs Plan

## Public preview

- Confirm GitHub Pages disabled preview remains available at `https://rosevearcreations.github.io/rosevear-comms-hub/`.
- Confirm the Interface Preview toggle shows QL-085.
- Confirm brand switching remains local and does not persist across refresh.
- Confirm synthetic conversation selection remains local and does not persist across refresh.

## Planned tabs

Confirm the preview lists the planned tabs:

- Overview
- Draft
- Timeline
- Safety

Confirm the tabs are planning affordances only and do not implement tab switching in QL-085.

## Safety checks

- No provider callback registration.
- No live phone webhook.
- No SMS sending.
- No call runtime.
- No recordings or transcripts.
- No AI reply generation.
- No persistence writes.
- No archive writes.
- No retention writes.
- No Supabase runtime read/write.
- No Supabase migration.
- No Supabase Edge Function.
- No live pilot runtime.

## Next build

QL-086 may implement local detail-tab switching only if the QL-085 main promotion and Pages deployment are green.
