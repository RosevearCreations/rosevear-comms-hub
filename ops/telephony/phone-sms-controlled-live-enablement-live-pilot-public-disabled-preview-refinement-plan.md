# QL-077 Ops Checklist — Public Disabled Preview Refinement Plan

## Public preview

- URL: `https://rosevearcreations.github.io/rosevear-comms-hub/`
- Host: GitHub Pages.
- Workflow: GitHub Pages Disabled Preview.
- Expected state: static, public, disabled, synthetic-only.

## Required checks

- App scaffold CI passes.
- GitHub Pages Disabled Preview workflow starts on `main` push.
- Static preview build passes.
- GitHub Pages configure step passes.
- Static preview artifact upload passes.
- Deploy disabled preview passes.

## Refinement checklist

- Confirm the public preview still loads after QL-077.
- Review whether the cockpit layout is understandable.
- Review whether Rosie Dazzlers and Devil n Dove are clearly separated.
- Review whether queue cards show urgency and draft-only state clearly.
- Review whether the customer timeline feels natural.
- Review whether locked Phone/SMS controls explain their disabled state.
- Review where circled-i help notes should appear first.
- Pick the first safe interaction candidate for QL-078.

## Hard blocks

Do not enable:

- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Recording.
- AI auto-send.
- Persistence writes.
- Live customer reads or writes.
- Archive writes.
- Retention policy writes.
- Supabase migrations or Edge Functions.
- Vercel.
- Cloudflare Pages.
- Live pilot runtime.
