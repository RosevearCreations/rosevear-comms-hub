# QL-075 — Public Disabled Preview Feedback Intake

QL-075 captures feedback from the public GitHub Pages disabled preview once the Pages workflow deploys successfully.

Target public review URL:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

## Purpose

This build turns the static disabled preview into an operator feedback checkpoint before any live provider, callback, SMS, call, AI, persistence, archive, retention, or live pilot behavior is enabled.

## Feedback prompts

- Does the public preview load at the GitHub Pages URL?
- Does the first screen communicate a shared Quo-lite communications hub for Rosie Dazzlers and Devil n Dove?
- Are the brand switcher, operator queue, customer timeline, disabled controls, and status cards clear?
- Is it obvious that SMS, calls, provider connections, callbacks, recordings, AI send, persistence, archive, retention, and live pilot runtime are disabled?
- What should change first: layout, labels, colours, help text, brand switching, inbox cards, timeline, or next-action panels?
- What is missing before the first real interactive console screen?

## Publication dependency

The GitHub Pages Disabled Preview workflow only deploys when the repository Actions variable is set exactly:

```text
ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true
```

If the workflow still skips, QL-075 captures deployment-gap feedback only and the public visual review remains blocked.

## Safety boundary

QL-075 does not enable:

- Provider callbacks.
- Phone webhooks.
- SMS sending.
- Call runtime.
- Call recording.
- AI auto-send.
- Persistence writes.
- Live customer reads or writes.
- Archive writes.
- Retention policy writes.
- Supabase migrations.
- Supabase Edge Functions.
- Vercel.
- Cloudflare Pages.
- Live pilot runtime.

Browser output must not contain service-role keys, provider credentials, callback tokens, live phone numbers, live message bodies, transcripts, recordings, or live customer data.

## Exit criteria

- App scaffold CI passes on `main`.
- GitHub Pages Disabled Preview workflow is observed on the final `main` push.
- The workflow either deploys static disabled assets or safely skips behind the variable gate.
- Public feedback is captured only if the URL is live.
- QL-076 is queued for public disabled preview feedback review.
