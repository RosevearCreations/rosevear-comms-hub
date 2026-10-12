# QL-103 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan

QL-103 adds a display-only implementation-plan layer above QL-102. It describes how a later reviewed build could implement a bounded evidence ledger, but it does not implement persistence.

## Scope

- Plan the future candidate schema shape using only bounded proof fields.
- Plan a future disabled-by-default write route contract without adding that route.
- Plan a future browser operator acceptance flow without adding a submit action.
- Plan retention, cleanup, rollback, disable, and owner approval requirements.
- Keep the public disabled preview safe-read only.

## Non-goals

QL-103 does not create Supabase schema, tables, migrations, views, indexes, RLS policies, RPC functions, storage objects, API write routes, browser submit controls, local persistence, operator acceptance storage, provider calls, Phone/SMS runtime, callbacks, archive writes, consent writes, audit/admin writes, retention jobs, AI generation/send, or live pilot runtime.

## Production boundary

The implementation plan remains declarative. Any future persistence implementation must be a separate reviewed build with its own production checks.

## Next

QL-104 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Implementation Plan Review.
