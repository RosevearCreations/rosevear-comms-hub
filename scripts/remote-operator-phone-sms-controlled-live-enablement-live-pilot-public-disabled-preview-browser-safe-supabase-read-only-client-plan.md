# Remote Operator Note — QL-089 Browser-Safe Supabase Read-Only Client Plan

Use the public disabled preview only as a review surface.

Expected state:

- Badge: QL-089.
- Title: Supabase read-only client plan.
- Brand switcher: browser-local.
- Conversation selector: hard-coded synthetic samples.
- Detail tabs: local React state only.
- Supabase: planned future target only; no browser client in QL-089.
- Cloudflare: Worker build check remains the deployment signal.

Manual review steps:

1. Open the public preview.
2. Open the Interface preview panel.
3. Switch between Rosie Dazzlers and Devil n Dove.
4. Select each synthetic conversation.
5. Open Overview, Draft, Timeline, and Safety tabs.
6. Confirm allowed future read sources and fallback rules are visible.
7. Confirm all live action buttons remain disabled.

Stop if the preview implies live customer reads, provider sends, SMS/call runtime, AI sending, archive writes, retention writes, or live pilot activation.
