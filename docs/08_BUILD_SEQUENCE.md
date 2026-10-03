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

Project:

```text
rosevearcreations
gxujcwpktaickcgzyvnu
https://gxujcwpktaickcgzyvnu.supabase.co
```

## QL-007 — Supabase Migration Application and Verification

Status: complete after connector reauthorization.

Result:

- Supabase connector can now access project `gxujcwpktaickcgzyvnu`.
- Migration `ql_007_supabase_dev_schema` was applied successfully.
- Tables, RLS, and seed brands were verified.

## QL-008A — Supabase Migration Verified and Types Generated

Status: complete.

Result:

- Generated types stored at `app/src/supabase/database.types.ts`.
- Follow-up migration stored at `database/migrations/0005_supabase_security_performance_indexes.sql`.
- Advisor follow-up migration `ql_007_security_performance_indexes` applied successfully.

## QL-008B — Auth and Safe Admin Access Decision

Status: complete.

Result:

- Decision documented in `docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md`.
- Migration prepared at `database/migrations/0006_auth_admin_access_policies.sql`.
- Migration `ql_008b_auth_admin_access_policies` applied successfully to Supabase during QL-009.
- Owner allowlist row seeded privately in Supabase for the ChatGPT account email.
- No secrets committed.

## QL-009 — Auth Boundary and Supabase Client Wiring

Status: complete.

Goal:

- Add Supabase client wiring behind feature flags.
- Add auth boundary helper.
- Keep live reads/writes disabled until login/session verification.
- Do not expose anonymous table access.

Result:

- Added `app/src/supabase/client.ts`.
- Added `app/src/auth/authBoundary.ts`.
- Added `@supabase/supabase-js` dependency.
- Added `database/migrations/0007_move_rls_helpers_private_schema.sql`.
- Applied `ql_009_move_rls_helpers_private_schema` to Supabase.
- Supabase security advisors returned no security lints after the private-helper migration.

## QL-010 — Admin Login UI and Session Verification

Goal:

- Add login/logout UI.
- Read Supabase auth session.
- Verify the signed-in user is allowlisted in `app_admins`.
- Keep local-only data as fallback.
- Do not import real customer data yet.

## QL-011 — Website Intake Integration Draft

Goal:

- Prepare RosieDazzlers and DevilnDove server-to-server intake payloads.
- Do not expose unauthenticated public write endpoints.

## QL-012 — Phone/SMS Provider Test Decision

Goal:

- Choose a test number approach.
- Compare VoIP.ms, Telnyx, Twilio, FreePBX/Asterisk, and 3CX again with real workflow needs.

Setup will be needed here for a test number or phone provider account.
