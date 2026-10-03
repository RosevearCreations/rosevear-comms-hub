# ADR-0006 — Supabase Development Project Setup Gate

## Status

Accepted.

## Context

Rosevear Comms Hub needs a shared backend after the local-only workflow is proven.

The owner created a Supabase project/account named `rosevearcreations` with project URL:

```text
https://gxujcwpktaickcgzyvnu.supabase.co
```

## Decision

Treat this Supabase project as the preferred development backend candidate.

QL-006 records the project and prepares a Supabase-ready schema migration, but does not connect the app or apply changes automatically because the connected Supabase tool does not currently have permission for the supplied project ref.

## Consequences

- We have a clear backend target.
- The app remains safe/local-only until migration and auth are ready.
- Secrets are not committed.
- Phone/SMS remains out of scope until shared data and auth are working.
- The next build should either apply the migration through an authorized connector or provide a manual SQL Editor path.

## Non-goals

- No real customer data.
- No public API write access.
- No anonymous app table access.
- No phone/SMS provider connection.
- No AI auto-send.
