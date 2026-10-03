# ADR-0005 — Postgres-first shared backend

## Status

Accepted for planning.

## Context

Rosevear Comms Hub needs to move from local demo data to shared data across devices later. The system has relational records: contacts, conversations, messages, tasks, intakes, consent logs, audit events, and future phone/SMS records.

The operator also cannot rely on local Bash because work is being done remotely through GitHub.

## Decision

Prepare the project for a Postgres-compatible shared backend while keeping QL-005 local-only.

Use SQL migrations as the portable source of truth.

Supabase/Postgres is the likely first managed provider when setup begins, but QL-005 does not require a live provider account, connection string, or deployment.

## Consequences

Positive:

- The schema remains portable.
- We can keep local-only testing safe until the workflow is proven.
- Supabase, Neon, Railway, Render, VPS Postgres, or another provider remain possible.
- Future row-level security and auth can be added without changing the product model.

Negative:

- Shared multi-device use is not available yet.
- LocalStorage data still must be treated as demo/test data.
- QL-006 will require a real provider decision and secure secret storage.

## Non-goals

- Do not connect live Postgres in QL-005.
- Do not commit credentials.
- Do not add phone/SMS providers yet.
- Do not port or forward existing numbers.
