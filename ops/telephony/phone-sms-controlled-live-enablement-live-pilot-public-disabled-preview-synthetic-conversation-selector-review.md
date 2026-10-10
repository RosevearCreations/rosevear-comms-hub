# QL-084 Ops Checklist — Public Disabled Preview Synthetic Conversation Selector Review

## Review steps

- Open the public preview URL: `https://rosevearcreations.github.io/rosevear-comms-hub/`.
- Open the floating Interface Preview panel.
- Confirm the panel shows QL-084.
- Switch between Rosie Dazzlers and Devil n Dove.
- Select each synthetic conversation under both brands.
- Confirm summary, draft-only copy, and timeline content update.
- Refresh the page and confirm the selected state resets.
- Confirm every live action remains locked and disabled.

## Expected result

The selector should feel useful for reviewing operator flow while staying clearly synthetic, local-only, and disabled-preview safe.

## Do not enable

- Provider callbacks
- Live phone webhooks
- SMS sending
- Call runtime
- Recordings
- AI send or AI replies
- Persistence writes
- Live customer access
- Archive writes
- Retention writes
- Supabase runtime changes
- Supabase migrations
- Supabase Edge Functions
- Vercel
- Cloudflare Pages
- Live pilot runtime

## Next queued build

QL-085 — Public Disabled Preview Synthetic Conversation Detail Tabs Plan.
