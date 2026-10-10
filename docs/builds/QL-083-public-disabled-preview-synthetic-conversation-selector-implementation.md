# QL-083 — Public Disabled Preview Synthetic Conversation Selector Implementation

## Result

Implemented the public disabled preview synthetic conversation selector.

## Changes

- Updated the floating Interface Preview to QL-083.
- Kept the Rosie Dazzlers / Devil n Dove browser-local brand switcher active.
- Added hard-coded synthetic conversation samples for each brand.
- Added browser-local selection of sample conversations.
- Updated summary, draft-only copy, and timeline based on the selected synthetic conversation.
- Added selector styling and responsive layout support.
- Added implementation guard and contract fixture.
- Added source documentation, ops checklist, remote-operator note, telephony boundary note, and build sequence update.

## Verification targets

- `npm install`
- `npm run check`
- `npm run build`
- GitHub Pages disabled preview workflow build and deploy.

## Safety boundary

No provider callbacks, live phone webhooks, SMS sending, call runtime, recording, AI send, persistence writes, live customer access, archive writes, retention writes, Supabase runtime reads/writes, Supabase migration, Supabase Edge Function, Vercel, Cloudflare Pages, or live pilot runtime is enabled.
