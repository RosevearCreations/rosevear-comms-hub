# Remote Operator Checklist

The current operator may not be able to run Bash locally. Prefer GitHub-first verification.

## For each build

1. Confirm source-of-truth docs are updated.
2. Confirm no secrets are committed.
3. Confirm no live phone/SMS/AI flags were enabled unless explicitly requested.
4. Confirm GitHub Actions exists for app check/build.
5. If GitHub status is not visible through the connector, say so honestly.
6. Do not ask the operator to run local commands unless there is no remote alternative.

## Current setup status

QL-005 does not require external setup.

The PostgreSQL.org account is not a hosted database. It does not provide a `DATABASE_URL` for the app.

## QL-006 likely setup request

When the operator is ready, ask them to choose or create a hosted Postgres provider/project.

Recommended first option:

- Supabase project for Rosevear Comms Hub development.

Information needed later:

- provider name;
- project/organization name;
- region;
- database connection string stored outside the repo;
- auth decision;
- storage decision.

Never ask the operator to paste secrets into normal chat unless there is a secure connector/workflow available.
