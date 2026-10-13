# QL-106 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Draft Plan

## Purpose

QL-106 turns the QL-105 readiness decision into a display-only implementation draft plan. It describes the future schema, write route, browser confirmation, retention, rollback, owner approval, and production verification gates without implementing any persistence.

## Safety boundary

QL-106 does **not** create schema, migrations, tables, views, indexes, policies, RPC functions, routes, browser writes, Supabase mutations, storage writes, local persistence, Phone/SMS runtime, callbacks, provider calls, archives, consent, audit/admin writes, retention jobs, AI generation/send, or live pilot runtime.

## Draft areas

- Proposed evidence-ledger schema remains text only.
- Proposed write route remains text only.
- Proposed browser confirmation remains text only.
- Proposed retention, cleanup, purge, rollback, and disable procedures remain text only.
- Proposed owner approval and production verification gates remain text only.

## Required next review

QL-107 must review this draft before any implementation build is considered. QL-106 grants no write permission.

## Production verification

Promotion requires PR-head app-build and final main app-build, GitHub Pages disabled preview build/deploy, Supabase Preview, and Cloudflare Workers production build.
