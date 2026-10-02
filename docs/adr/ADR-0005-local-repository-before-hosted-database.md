# ADR-0005 — Local Repository Before Hosted Database

## Status

Accepted.

## Context

The hub needs a real data flow, but we are not ready to choose or configure production hosting, Supabase, PBX/SMS systems, or phone-number routing. Existing Cloudflare and Vercel usage must also be considered before adding another production deployment.

## Decision

QL-003 uses a browser-local repository backed by `localStorage`, plus a small API facade, before any hosted database is connected.

## Consequences

Positive:

- We can test the workflow immediately.
- No external setup is required.
- No customer phone numbers or recordings are moved into a hosted system yet.
- The UI can be developed against a stable repository/API boundary.

Negative:

- Data is not shared between computers.
- Data can be lost if browser storage is cleared.
- This is not a production database.
- We still need a hosted backend before real customers or phone/SMS integrations.

## Follow-up

QL-005 should revisit Supabase/Postgres, auth, storage, and deployment once the local workflow proves useful.
