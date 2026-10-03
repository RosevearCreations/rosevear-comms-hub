# Database

This folder contains the Postgres-compatible schema and migration drafts for Rosevear Comms Hub.

## Current stage

QL-005 keeps the running app local-only. The shared backend is not connected yet.

## Files

```text
schema.sql                              Full draft schema from the foundation build
migrations/0001_foundation.sql          Initial migration placeholder
migrations/0002_indexes_and_constraints.sql
migrations/0003_shared_backend_foundation.sql
seeds/001_default_tags.sql
```

## Provider direction

Use a Postgres-compatible backend when shared storage begins.

Likely first managed provider: Supabase/Postgres.

Other possible providers: Neon, Railway, Render, VPS-hosted Postgres, or another trusted Postgres host.

## Important

A PostgreSQL.org account does not create a hosted database for this app. It is not a replacement for a managed Postgres provider, Supabase project, VPS database, or local Postgres installation.

## No secrets

Never commit:

- database URLs;
- database passwords;
- Supabase service role keys;
- API tokens;
- webhook secrets;
- private customer exports.

Use `.env.example` as the template only.
