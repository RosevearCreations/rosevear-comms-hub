# Remote Operator Checklist — QL-070 Disabled Interface Preview Review

Use this checklist to review the disabled interface preview without enabling any live path.

## Confirm visible preview

- Open the app locally or in the existing review environment.
- Use the floating **Interface preview** button.
- Confirm it shows **QL-070**.
- Confirm the future URL is visible as:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

- Confirm the preview explains that the URL is not live yet.

## Confirm reviewed regions

- Brand switcher.
- Inbox queue.
- Customer/contact summary.
- Conversation timeline.
- Disabled Phone/SMS controls.
- Follow-up task board.
- Safe deployment status.
- Manual readiness checklist.

## Confirm disabled controls

The following controls must remain disabled:

- Send SMS.
- Call customer.
- Connect provider.
- Attach live number.
- Register callback.
- Persist live event.
- Archive transcript.
- Start live pilot.

## Confirm next safe step

The next safe step is a GitHub Pages disabled preview deployment plan, not live Phone/SMS enablement.

## Do not add in QL-070

- GitHub Pages workflow.
- GitHub Pages deployment.
- Vercel.
- Cloudflare Pages.
- Supabase migration.
- Supabase Edge Function.
- Provider credentials.
- Callback route.
- Webhook.
- Live number.
- SMS sending.
- Call runtime.
- Recording.
- AI sending.
- Persistence writes.
- Archive writes.
- Retention policy writes.
- Live pilot runtime.
