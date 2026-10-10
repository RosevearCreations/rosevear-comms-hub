# QL-079 — Public Disabled Preview First Safe Interaction Plan

Status: complete.

## Purpose

QL-079 chooses the first safe interaction for the public disabled GitHub Pages preview without enabling any live Phone/SMS, provider, Supabase runtime, persistence, archive, retention, AI, or live pilot path.

## Public preview target

- URL: `https://rosevearcreations.github.io/rosevear-comms-hub/`
- Base path: `/rosevear-comms-hub/`
- Host: GitHub Pages Disabled Preview workflow.

## Selected first safe interaction

The first safe interaction selected for the next implementation build is:

**Sample brand switcher**

The interaction should allow the operator preview to switch between synthetic Rosie Dazzlers and Devil n Dove public-preview panels.

## Why this is first

The sample brand switcher is the safest useful interaction because it:

- validates the shared-console model for both brands;
- can be implemented with React state only;
- can use hard-coded synthetic preview data;
- does not need Supabase, provider credentials, callback routes, phone numbers, customer records, message bodies, transcripts, recordings, persistence writes, archive writes, or retention writes;
- keeps every live action visibly locked.

## Next implementation acceptance checks

QL-080 must satisfy all of these checks before it can be considered complete:

1. Use only hard-coded synthetic preview data or browser-local state.
2. Do not import or initialize the Supabase client.
3. Do not read or write persistence, archive, retention, or live customer records.
4. Do not expose provider credentials, service-role keys, callback tokens, live phone numbers, message bodies, transcripts, or recordings.
5. Do not enable SMS sending, call runtime, recording, AI send, provider delivery, callback registration, or live pilot behavior.
6. Keep every live action visibly locked and inert while allowing the selected safe UI interaction.

## Rejected as first interactions

These options are rejected as the first interaction because they introduce backend, provider, or live-data risk too early:

- real SMS draft send;
- call test button;
- provider connect flow;
- callback verification route;
- Supabase-backed inbox reads;
- live customer search;
- archive or retention action;
- AI reply generation.

## Runtime boundary

The following remain disabled and out of scope:

- provider callbacks;
- live phone webhooks;
- SMS sending;
- call runtime;
- recordings;
- AI send;
- persistence writes;
- live customer access;
- archive writes;
- retention writes;
- Supabase runtime changes;
- Supabase migrations;
- Supabase Edge Functions;
- Vercel;
- Cloudflare Pages;
- live pilot runtime.

## Next queued build

QL-080 — Public Disabled Preview First Safe Interaction Implementation.
