# 14 — Application Scaffold

## Build

QL-002 — Application Scaffold.

## Decision

Use **Vite + React + TypeScript** for the first runnable admin shell.

## Why this choice

The hub needs to stay flexible because current hosting capacity is constrained by existing RosieDazzlers, DevilnDove, Cloudflare, and Vercel usage. A Vite app keeps the first UI small, local-first, and easy to later deploy as a static app or integrate behind a separate API.

## What QL-002 includes

- Local runnable app in `app/`
- Admin shell layout
- Brand switcher
- RosieDazzlers and DevilnDove workspaces
- Placeholder inbox
- Placeholder conversation detail
- Static sample data
- TypeScript types for brands and conversations
- CI workflow for typecheck/build

## What QL-002 intentionally excludes

- No database connection
- No Supabase connection
- No phone provider
- No SMS provider
- No Bell Fibe forwarding
- No 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms integration
- No AI sending
- No call recording
- No customer data stored beyond static placeholder samples

## Local runbook

```bash
cd app
npm install
npm run dev
```

Typecheck and build:

```bash
cd app
npm run check
npm run build
```

## QL-003 handoff

QL-003 should replace static placeholder data with the first real persistence/API layer. It should not connect live telephony yet. The goal is to make the admin shell read/write contacts, conversations, messages, tasks, and intake requests from a real local or hosted backend.
