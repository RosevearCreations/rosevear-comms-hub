# QL-083 Ops Checklist — Synthetic Conversation Selector Implementation

## Required evidence

- App scaffold CI passes on the feature branch, promotion PR, and final main push.
- GitHub Pages disabled preview workflow builds and deploys on final main.
- Public URL remains `https://rosevearcreations.github.io/rosevear-comms-hub/`.

## Operator preview checks

- Open the Interface Preview.
- Confirm the badge shows QL-083.
- Switch between Rosie Dazzlers and Devil n Dove.
- Select each synthetic conversation for the active brand.
- Confirm summary, draft-only copy, and timeline update.
- Confirm all locked actions remain disabled.

## Blocked operations

Do not enable provider callbacks, live phone webhooks, SMS sending, call runtime, recording, AI send, persistence writes, live customer access, archive writes, retention writes, Supabase runtime reads/writes, migrations, Edge Functions, Vercel, Cloudflare Pages, or live pilot runtime.
