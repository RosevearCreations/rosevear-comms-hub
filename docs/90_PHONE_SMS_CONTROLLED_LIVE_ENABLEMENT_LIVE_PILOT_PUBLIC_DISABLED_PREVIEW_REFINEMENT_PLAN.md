# QL-077 — Phone/SMS Controlled Live Enablement Live-Pilot Public Disabled Preview Refinement Plan

## Status

QL-077 is a public disabled preview refinement-plan build.

The public review URL remains:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

The build keeps the GitHub Pages disabled preview path active and plans the next visible improvements before any additional interaction or runtime is introduced.

## Scope

QL-077 may:

- Plan static public-preview layout refinements.
- Plan clearer brand switching between Rosie Dazzlers and Devil n Dove.
- Plan better inbox cards, timeline wording, disabled-control labels, and status copy.
- Plan circled-i help placements.
- Plan accessibility and responsive improvements.
- Select the first future browser-safe interaction using synthetic or local-only state.
- Keep the public GitHub Pages disabled preview as the current review surface.

QL-077 must not:

- Connect a Phone/SMS provider.
- Enable provider callbacks or live phone webhooks.
- Send SMS messages.
- Place calls.
- Record calls.
- Enable AI send behavior.
- Write persistence data.
- Read or write live customer records.
- Write archive or retention data.
- Add a Supabase migration or Edge Function.
- Add Vercel or Cloudflare Pages.
- Enable live pilot runtime.

## Refinement priorities

1. **Layout clarity** — make the public preview easier to scan while keeping the current static safety boundary.
2. **Brand switching context** — make the Rosie Dazzlers and Devil n Dove inbox relationship clear.
3. **Inbox card readability** — improve urgency, source, draft-only, and brand labels.
4. **Customer timeline readability** — improve the sample timeline sequence and locked SMS/call messaging.
5. **Disabled action clarity** — make every locked control explain why it is disabled and what proof is needed later.
6. **Help system placement** — plan circled-i notes near brand, queue, timeline, controls, and deployment status.
7. **Accessibility and responsiveness** — plan keyboard, readable-label, and smaller-screen improvements.
8. **First browser-safe interaction** — prefer brand switching, sample conversation selection, task filtering, or a local feedback checklist.

## Decision

QL-077 approves a **static public preview refinement plan** only.

The next build may implement visible public-preview refinements, but any interaction must remain browser-safe and synthetic/local-only unless a later build explicitly proves a backend boundary.

## Safety statement

The browser bundle must not include service-role keys, provider credentials, callback tokens, live phone numbers, live message bodies, transcripts, recordings, or live customer records.

Provider callbacks, live webhooks, SMS sending, call runtime, recording, AI send, persistence writes, live customer access, archive writes, retention writes, Supabase runtime changes, Vercel, Cloudflare Pages, and live pilot runtime remain disabled.
