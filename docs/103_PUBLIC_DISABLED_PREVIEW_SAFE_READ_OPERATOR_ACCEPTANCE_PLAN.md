# QL-095 — Public Disabled Preview Safe Read Operator Acceptance Plan

## Purpose

QL-095 adds an operator-facing acceptance plan to the public disabled preview safe-read panel. It converts QL-094 evidence into human acceptance questions, sign-off prompts, and bounded review criteria without enabling live communications, browser writes, or private payload reads.

## Acceptance scope

The operator can review:

- selected brand context;
- active source label and safe-read mode;
- conversation and system-status row counts;
- fallback reason text;
- rejected-row counts and bounded reasons;
- approved read target names;
- runtime lockout statements.

The operator cannot use QL-095 to submit acceptance, store acceptance, send SMS, start calls, read live customer data, register callbacks, write audits, write consent, archive payloads, or enable AI generation/send.

## Safe-read boundary

Approved browser read targets remain limited to:

- `public.ql_public_synthetic_conversations`
- `public.ql_public_system_status`

All operator acceptance prompts are derived from QL-094 evidence. QL-095 does not add any Supabase table, RPC, storage bucket, auth flow, Edge Function, Phone/SMS provider path, AI runtime path, or live pilot runtime.

## Operator acceptance questions

1. Can the operator see the selected brand context without seeing live customer/contact/provider payload?
2. Does the operator understand whether the run is local fallback, validated synthetic Supabase, or mixed fallback?
3. Are rejected rows explained well enough without exposing raw private data?
4. Can the operator clearly see that QL-095 is not a live communications release?
5. Has the operator recorded acceptance in normal project notes before any future live-read or live-send build is considered?

## Verification target

- App scaffold CI green.
- Supabase Preview green.
- GitHub Pages disabled preview green when posted.
- `Workers Builds: rosevear-comms-hub` green on final `main`.

## Next queued

QL-096 — Public Disabled Preview Safe Read Operator Acceptance Review.
