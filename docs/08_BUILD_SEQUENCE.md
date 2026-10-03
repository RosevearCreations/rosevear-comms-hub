# 08 — Build Sequence

## QL-001 — Structure and Documentation Foundation

Status: complete.

Goal:

- Create repository structure.
- Add source-of-truth docs.
- Add brand config files.
- Add data model draft.
- Add provider-neutral telephony notes.
- Add compliance notes.
- Add first implementation sequence.

## QL-002 — Application Scaffold

Status: complete.

Goal:

- Choose initial app framework.
- Create local development app shell.
- Add admin layout placeholder.
- Add brand switcher.
- Add placeholder inbox.
- Add basic typecheck/build commands.

Decision:

- Use Vite + React + TypeScript for the first local admin shell.

## QL-003 — Database and API Foundation

Status: complete.

Goal:

- Replace static-only screen data with a local repository layer.
- Add browser localStorage persistence for safe local workflow testing.
- Add contact, conversation, message, intake, task, and audit event TypeScript types.
- Add a local API facade so the UI does not depend directly on storage details.
- Add interactive create/status/note/task actions.
- Expand API contract drafts.
- Add SQL index/constraint draft for the future hosted database.

## QL-004 — Admin Inbox MVP

Status: complete.

Goal:

- Improve inbox filtering and search.
- Add contact detail view.
- Add intake request detail view.
- Add task dashboard.
- Add status/tag filters.
- Add local export/import for backup during pre-hosted development.

## QL-005 — Shared Backend Decision and Foundation

Status: complete.

Goal:

- Decide the first shared backend direction.
- Document the difference between PostgreSQL software/community accounts and hosted database accounts.
- Keep the app local-only while preparing for a Postgres-compatible hosted backend.
- Add a hosted-backend readiness migration.
- Add environment placeholders without real secrets.

Decision:

- Use a Postgres-compatible backend first.
- Supabase/Postgres remains the likely first managed option.

## QL-006 — Supabase Project Setup Gate

Status: complete.

Goal:

- Record the Supabase project supplied by the owner.
- Prepare a Supabase-ready schema migration.
- Document connector permission gap.
- Keep app local-only until migration/auth/secrets are ready.

Project:

```text
rosevearcreations
gxujcwpktaickcgzyvnu
https://gxujcwpktaickcgzyvnu.supabase.co
```

Green criteria:

- Project details recorded without secrets.
- Supabase-ready migration exists.
- Environment template exists.
- No live app connection yet.
- No real customer data used.
- No phone/SMS/AI connected.

## QL-007 — Supabase Migration Application and Verification

Status: blocked for automatic application; manual route documented.

Goal:

- Apply `database/migrations/0004_supabase_dev_schema.sql` if connector permissions are available.
- Otherwise provide exact manual SQL Editor steps.
- Verify table creation.
- Verify RLS is enabled.
- Generate TypeScript types if connector access is available.
- Keep the frontend local-only until auth/RLS policies are intentionally added.

Result:

- Supabase connector still cannot access project `gxujcwpktaickcgzyvnu`.
- Automatic migration was not applied.
- Manual migration and verification instructions were added in `docs/19_SUPABASE_MIGRATION_VERIFICATION.md`.
- Remote operator checklist was added in `scripts/remote-operator-supabase-verification.md`.

Setup needed to unblock automatic route:

- Supabase connector permission for project `gxujcwpktaickcgzyvnu`.

Manual route:

- Owner applies `database/migrations/0004_supabase_dev_schema.sql` in Supabase SQL Editor.
- Owner runs the verification queries in `docs/19_SUPABASE_MIGRATION_VERIFICATION.md`.
- Owner pastes only non-secret verification results back into chat.

## QL-008A — Supabase Migration Verified and Types Generated

Use this path if QL-007 migration is applied and verified.

Goal:

- Generate TypeScript database types.
- Store generated types in the repo.
- Run Supabase advisors if connector access is available.
- Keep frontend local-only until auth policies are ready.

## QL-008B — Auth and Safe Admin Access Decision

Use this path if QL-007 is still blocked.

Goal:

- Decide owner/admin-only auth route.
- Decide if we use Supabase Auth.
- Design RLS policies before adding live app access.

## QL-009 — Website Intake Integration Draft

Goal:

- Prepare RosieDazzlers and DevilnDove server-to-server intake payloads.
- Do not expose unauthenticated public write endpoints.

## QL-010 — Phone/SMS Provider Test Decision

Goal:

- Choose a test number approach.
- Compare VoIP.ms, Telnyx, Twilio, FreePBX/Asterisk, and 3CX again with real workflow needs.

Setup will be needed here for a test number or phone provider account.
