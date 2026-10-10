# QL-085 — Public Disabled Preview Synthetic Conversation Detail Tabs Plan

## Purpose

QL-085 plans the next safe refinement for the public disabled preview: detail tabs for the selected hard-coded synthetic conversation.

The build keeps the public GitHub Pages preview live at:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

The Vite base path remains:

```text
/rosevear-comms-hub/
```

## Scope

QL-085 may show the planned detail tabs in the preview, but it must not implement tab switching yet.

Approved planned tabs:

- Overview
- Draft
- Timeline
- Safety

## Current allowed interactions

The following interactions remain allowed because they are browser-local only:

- Rosie Dazzlers / Devil n Dove brand switching.
- Hard-coded synthetic conversation selection.

Both interactions must continue to use React state only and must reset with the browser session.

## Deferred implementation

QL-086 may implement local detail-tab switching only after this plan remains green on `main`.

QL-086 must still use:

- Hard-coded synthetic conversations only.
- Browser-local React state only.
- No persistence.
- No provider source.
- No live customer source.

## Blocked sources

The planned detail tabs must not use:

- Supabase conversation rows.
- Provider inbox imports.
- Live customer records.
- SMS or call history.
- Recordings or transcripts.
- AI-generated replies.
- Archives.
- Retention records.
- Callback payloads.

## Runtime lock

QL-085 does not enable provider callbacks, live phone webhooks, SMS sending, call runtime, recordings, AI send, persistence writes, archive writes, retention writes, Supabase migrations, Supabase Edge Functions, Vercel, Cloudflare Pages, or live pilot runtime.
