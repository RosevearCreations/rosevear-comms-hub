# QL-084 — Public Disabled Preview Synthetic Conversation Selector Review

## Purpose

QL-084 reviews the QL-083 synthetic conversation selector now visible in the public disabled preview.

The review confirms that the interaction is useful for evaluating operator flow while remaining fully browser-local, hard-coded, synthetic, and disconnected from all live Phone/SMS, provider, Supabase, AI, persistence, archive, retention, and live pilot runtime paths.

## Public preview

- URL: `https://rosevearcreations.github.io/rosevear-comms-hub/`
- Vite base path: `/rosevear-comms-hub/`
- Preview surface: floating Interface Preview panel
- Visible build state: `QL-084`

## Review findings

- Rosie Dazzlers / Devil n Dove brand switching remains browser-local React state only.
- Synthetic conversation selection remains hard-coded and browser-local.
- Selecting a conversation changes only sample summary, draft-only copy, and timeline content.
- The selected brand and selected conversation reset on page reload because they are not persisted.
- Locked live actions remain visibly disabled.
- The interaction improves review value without introducing provider, backend, customer-data, Phone/SMS, AI, archive, retention, or live-pilot risk.

## Approved next step

QL-084 approves planning for QL-085: Public Disabled Preview Synthetic Conversation Detail Tabs Plan.

QL-085 may plan browser-local tabs for the selected synthetic conversation, such as:

- Summary
- Draft-only response
- Local synthetic history
- Review notes

QL-085 must remain planning-only unless explicitly advanced into an implementation build later.

## Still blocked

QL-084 does not enable:

- Provider callbacks
- Live phone webhooks
- SMS sending
- Call runtime
- Recording
- AI send or AI-generated replies
- Persistence writes
- Live customer reads or writes
- Archive writes
- Retention policy writes
- Provider account connection
- Live-number attachment
- Callback registration
- Supabase runtime reads or writes
- Supabase migrations
- Supabase Edge Functions
- Vercel
- Cloudflare Pages
- Live pilot runtime

## Production verification requirement

Before QL-084 can be considered promoted:

- Feature PR CI must pass `npm install`, `npm run check`, and `npm run build`.
- `dev → main` promotion CI must pass `npm install`, `npm run check`, and `npm run build`.
- Final `main` App scaffold CI must pass.
- Final `main` GitHub Pages Disabled Preview workflow must build and deploy successfully.
