# QL-068 — Phone/SMS Controlled Live Enablement Live-Pilot Disabled Interface Pathway Decision Gate

## Purpose

QL-068 decides the disabled interface pathway after QL-067 post-closure readiness review.

This is a decision gate only. It does not deploy hosting, enable provider runtime, create Supabase migrations, or start any live phone/SMS behavior.

## Decision

- Future disabled static interface candidate: GitHub Pages.
- Future backend boundary candidate: Supabase Edge Functions.
- Rejected for this rough-sketch stage: Vercel and Cloudflare Pages.
- Rejected runtime option: any live phone/SMS provider, callback, webhook, SMS, call, recording, AI, persistence, archive, retention, or live pilot execution.

## Why GitHub Pages is only a candidate

The current account constraints make new Vercel or Cloudflare Pages usage undesirable. GitHub Pages can be planned later as a static disabled interface path, but this build does not add a GitHub Pages workflow, configure GitHub Pages, or expose a public deployment URL.

## Browser boundary

A later static interface may use only public browser-safe variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The browser must never contain:

- `SUPABASE_SERVICE_ROLE_KEY`
- `PHONE_SMS_PROVIDER_API_KEY`
- `PHONE_SMS_PROVIDER_API_SECRET`
- `PHONE_SMS_WEBHOOK_SIGNING_SECRET`
- `TWILIO_AUTH_TOKEN`
- `TELNYX_API_KEY`
- callback tokens
- live customer data
- live phone numbers
- message bodies
- transcripts
- recordings

## Supabase boundary

Supabase Edge Functions are reserved for a later backend boundary only. They are the correct future location for server-side secrets, provider webhook verification, callback handling, and service-role work, but QL-068 does not create or deploy any functions.

## Explicit non-actions

QL-068 does not:

- add GitHub Pages deployment,
- add Vercel hosting,
- add Cloudflare Pages hosting,
- add a Supabase migration,
- add a Supabase Edge Function,
- connect a provider account,
- attach a live number,
- register a callback,
- configure a webhook,
- send SMS,
- run calls,
- record calls,
- generate or send AI drafts,
- read or write live customer data,
- write persistence,
- write archives,
- write retention policies,
- start live pilot runtime.

## Result

QL-068 approves only a later disabled interface implementation plan.

Next queued build: QL-069 — Phone/SMS Controlled Live Enablement Live-Pilot Disabled Interface Implementation Plan.
