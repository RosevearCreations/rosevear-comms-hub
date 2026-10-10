# QL-082 — Public Disabled Preview Synthetic Conversation Selector Plan

Status: complete when promoted to `main` with production checks green.

## Purpose

QL-082 plans the next safe interaction for the GitHub Pages public disabled preview after QL-081 reviewed the first safe brand switcher.

The next interaction is a synthetic conversation selector. It should let a reviewer choose between hard-coded sample conversations for the already selected brand.

## Public preview

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

The preview remains static and served with the Vite base path:

```text
/rosevear-comms-hub/
```

## Planned interaction boundary

The synthetic conversation selector may:

- list two or three hard-coded sample conversations for Rosie Dazzlers;
- list two or three hard-coded sample conversations for Devil n Dove;
- store the selected sample conversation in browser-local React state;
- update synthetic queue text, timeline text, and help copy;
- reset when the page reloads.

The selector must not:

- read Supabase rows;
- import provider inbox messages;
- read live customer records;
- send SMS;
- start calls;
- register callbacks;
- generate AI replies;
- persist events;
- write archives;
- write retention policies;
- start live-pilot runtime.

## QL-082 result

- Updated the floating interface preview to QL-082 selector-planning state.
- Kept the existing browser-local Rosie Dazzlers / Devil n Dove brand switcher live.
- Planned the synthetic conversation selector as the next safe local-only interaction.
- Added selector candidates for quote follow-up, missed-call callback, custom order clarification, and workshop detail questions.
- Added rejected selector sources for Supabase, provider inbox, live customer, SMS/call, AI, archive, retention, and callback payloads.
- Added guard and contract evidence.

## Decision

QL-082 approves only the next safe implementation build:

```text
QL-083 — Public Disabled Preview Synthetic Conversation Selector Implementation
```

## Safety boundary

Provider callbacks, live phone webhooks, SMS sending, call runtime, recording, AI send, persistence writes, live customer reads/writes, archive writes, retention writes, Supabase runtime changes, Supabase migrations, Supabase Edge Functions, Vercel, Cloudflare Pages, and live pilot runtime remain disabled.
