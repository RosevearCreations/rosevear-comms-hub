# QL-083 — Public Disabled Preview Synthetic Conversation Selector Implementation

## Status

Complete pending promotion.

## Purpose

QL-083 implements the first conversation-level interaction in the public disabled preview. The interaction is intentionally limited to hard-coded synthetic sample conversations and browser-local React state.

## Implemented interaction

- Keep the existing Rosie Dazzlers / Devil n Dove brand switcher active.
- Add a synthetic conversation selector for the currently selected brand.
- Change only local preview text when a sample conversation is selected.
- Update only the visible summary, draft-only copy, and timeline for the selected synthetic conversation.
- Store the selected brand and selected conversation only in React state for the current browser session.

## Synthetic data only

QL-083 uses local constants embedded in the public preview. It does not read from Supabase, provider inboxes, live customer records, phone/SMS history, recordings, transcripts, archive records, retention records, callback payloads, or AI-generated content.

## Public preview URL

`https://rosevearcreations.github.io/rosevear-comms-hub/`

## Vite base path

`/rosevear-comms-hub/`

## Acceptance checks

- App scaffold CI must pass.
- GitHub Pages disabled preview workflow must build and deploy.
- Brand buttons must remain clickable.
- Conversation buttons must update only synthetic content.
- Locked action controls must remain disabled.
- No provider callback, live phone webhook, SMS send, call runtime, recording, AI send, persistence write, live customer access, archive write, retention write, Supabase migration, Supabase Edge Function, Vercel deployment, Cloudflare Pages deployment, or live pilot runtime may be enabled.

## Next allowed build

QL-084 — Public Disabled Preview Synthetic Conversation Selector Review.
