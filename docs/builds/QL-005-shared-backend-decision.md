# QL-005 — Shared Backend Decision and Foundation

## Status

Complete.

## Summary

QL-005 records the backend direction and prepares the repo for a future hosted Postgres-compatible database without connecting any external service yet.

## Added

- Backend decision documentation.
- PostgreSQL.org account clarification.
- Postgres-first ADR.
- Hosted database readiness migration.
- Expanded environment placeholders.
- Updated build sequence.
- Database README.
- Remote-operator checklist.

## Verification

Remote/GitHub-first verification:

- Repository source of truth updated.
- No credentials added.
- No hosted database required.
- No phone/SMS/AI enabled.
- App remains localStorage-based until QL-006.

## Setup needed

None for QL-005.

The PostgreSQL.org account is useful context, but QL-005 does not need it to run.

## Setup likely needed in QL-006

- Choose hosted Postgres provider.
- Create a development database/project.
- Store connection string outside GitHub source.
- Decide auth/access path.
- Apply schema/migrations.

## Safety notes

Do not enter real production customer data until the hosted backend, auth, privacy, and backup plan are active.
