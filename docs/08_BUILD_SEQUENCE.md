# 08 — Build Sequence

## QL-001 — Structure and Documentation Foundation

Status: complete.

## QL-002 — Application Scaffold

Status: complete.

Decision: use Vite + React + TypeScript for the first local admin shell.

## QL-003 — Database and API Foundation

Status: complete.

Result: local repository layer, localStorage persistence, interactive lead/status/note/task actions, and draft API contracts.

## QL-004 — Admin Inbox MVP

Status: complete.

Result: inbox search/filters, contact and intake details, task dashboard, and local import/export.

## QL-005 — Shared Backend Decision and Foundation

Status: complete.

Decision: use a Postgres-compatible backend first, with Supabase/Postgres as the first managed provider path.

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

Result: development schema applied, expected tables verified, RLS verified, seed brands verified.

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
- Owner allowlist row seeded privately in Supabase.
- No secrets committed.

## QL-009 — Auth Boundary and Supabase Client Wiring

Status: complete.

Result:

- Added `app/src/supabase/client.ts`.
- Added `app/src/auth/authBoundary.ts`.
- Added `@supabase/supabase-js` dependency.
- Added `database/migrations/0007_move_rls_helpers_private_schema.sql`.
- Applied `ql_009_move_rls_helpers_private_schema` to Supabase.
- Supabase security advisors returned no security lints after the private-helper migration.

## QL-010 — Admin Login UI and Session Verification

Status: complete.

Result:

- Added guarded admin login/session UI in `app/src/auth/AdminSessionGate.tsx`.
- Wrapped the app with the session gate in `app/src/main.tsx`.
- Kept the default runtime local-only unless browser-safe Supabase feature flags are enabled.
- Verified the live Supabase owner allowlist row exists without exposing the email in repo docs.
- Verified RLS policies exist for all application tables.
- Kept live customer-data reads and writes disabled.

## QL-011 — Website Intake Integration Draft

Goal:

- Prepare RosieDazzlers and DevilnDove server-to-server intake payloads.
- Do not expose unauthenticated public write endpoints.

## QL-012 — Phone/SMS Provider Test Decision

Goal:

- Choose a test number approach.
- Compare VoIP.ms, Telnyx, Twilio, FreePBX/Asterisk, and 3CX again with real workflow needs.

Setup will be needed here for a test number or phone provider account.
