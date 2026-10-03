# 17 — Shared Backend Decision

## Build

QL-005 — Shared Backend Decision and Foundation.

## Decision

Use a **Postgres-compatible shared backend** as the first hosted data path.

The app remains local-only in QL-005. This build prepares the source of truth, schema boundary, environment placeholders, and setup gate. It does not connect a live database.

## Why Postgres

The data model is naturally relational:

- contacts;
- brand profiles;
- conversations;
- messages;
- intake requests;
- follow-up tasks;
- tags;
- consent logs;
- audit events;
- future phone calls and SMS messages.

Postgres lets us preserve referential integrity, indexes, audit history, and brand-aware access rules without inventing a custom storage layer.

## Important clarification about the PostgreSQL.org account

A PostgreSQL.org account is useful for the PostgreSQL community website, mailing lists, downloads, documentation, and related project resources.

It is **not** the same thing as creating a hosted database for this application.

To run Rosevear Comms Hub as a shared app, we eventually need one of these:

- a managed Postgres project, such as Supabase/Postgres, Neon, Railway, Render, or another provider;
- a self-hosted Postgres server on a VPS;
- an existing trusted Postgres instance we control.

## Recommended provider direction

Use **Supabase/Postgres** as the likely first managed provider when we are ready because:

- it is Postgres-compatible;
- RosieDazzlers already uses Supabase patterns elsewhere;
- it can later support auth, storage, row-level security, and server-side access;
- SQL migrations can be carried forward.

This is a recommendation, not a live connection.

## Why not connect it now

We should not connect a live database until we confirm:

1. the local workflow is useful enough to preserve;
2. we know who needs admin access;
3. we know where attachments/photos should live;
4. we know how to handle authentication;
5. we know whether the first website integration is RosieDazzlers or DevilnDove;
6. we have a safe place to store secrets outside the repo.

## Current data boundary

QL-005 still stores local demo data in browser `localStorage` only.

Do not enter real production customer data yet.

Do not store:

- real customer phone numbers;
- private customer photos;
- call recordings;
- voicemail transcripts;
- production SMS;
- payment information;
- private health/personal notes.

## Shared-backend readiness checklist

Before QL-006 starts, decide:

- [ ] Hosted provider: Supabase/Postgres, Neon, Railway, Render, VPS, or other.
- [ ] Project name.
- [ ] Region.
- [ ] Whether we use Supabase auth or app-owned auth.
- [ ] Whether attachments use Supabase Storage or another object store.
- [ ] Whether the first live integration is RosieDazzlers quote intake or DevilnDove custom intake.
- [ ] How secrets will be stored.
- [ ] Whether GitHub Actions should run schema checks.

## QL-006 setup trigger

QL-006 is the first build where outside setup may be required.

Needed then:

- hosted Postgres database/project;
- secure `DATABASE_URL` outside the repo;
- owner/admin login plan;
- decision on where the app will be hosted.

Phone/SMS setup still waits until after the shared data layer works.

## Safety rules preserved

- No phone/SMS integration.
- No number forwarding or porting.
- No AI auto-send.
- No call recording.
- No real customer data.
- No committed secrets.
