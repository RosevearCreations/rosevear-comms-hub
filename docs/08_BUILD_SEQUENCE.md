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

## QL-011 — Supabase Read Model and Local Fallback

Status: complete.

Result:

- Added `app/src/supabase/readModel.ts`.
- Added safe reference reads for `public.brands` and the signed-in admin allowlist row.
- Preserved local fallback when Supabase is not configured.
- Kept live customer-data reads and writes disabled.

## QL-012 — Website Intake Integration Draft

Status: complete.

Result:

- Added website intake schema at `api/contracts/website-intake.schema.json`.
- Added TypeScript contract at `integrations/website-intake/websiteIntakeContract.ts`.
- Added integration notes at `integrations/website-intake/README.md`.
- Added source-of-truth doc at `docs/25_WEBSITE_INTAKE_INTEGRATION_DRAFT.md`.
- Added remote operator environment checklist at `scripts/remote-operator-github-environments-checklist.md`.
- Documented recommended GitHub environment titles: `preview` and `production`.
- Kept public anonymous Supabase table access disabled.
- Did not connect live websites yet.

## QL-013 — Protected Intake Endpoint Skeleton

Status: complete.

Result:

- Added provider-neutral endpoint skeleton at `api/endpoints/protectedIntakeEndpoint.ts`.
- Added response schema and example request in `api/contracts/`.
- Added source-of-truth doc at `docs/26_PROTECTED_INTAKE_ENDPOINT_SKELETON.md`.
- Added remote operator checklist at `scripts/remote-operator-protected-intake-endpoint-checklist.md`.
- Endpoint is disabled by default.
- Requires server-side origin and shared-secret checks when enabled.
- Returns dry-run success until persistence is wired.
- Does not add anonymous Supabase policies.
- Does not write live customer data yet.

## QL-014 — Intake Persistence Adapter Draft

Status: complete.

Result:

- Added provider-neutral persistence adapter at `api/persistence/intakePersistenceAdapter.ts`.
- Added draft mapping from website intake to contact, brand profile, conversation, message, intake, follow-up task, and audit event records.
- Added persistence plan schema and example plan.
- Kept persistence disabled by default.
- Did not add a Supabase migration.
- Did not enable live customer-data writes.

## QL-015 — Protected Intake Deployment Readiness Gate

Status: complete.

Result:

- Added deployment readiness source-of-truth doc at `docs/28_PROTECTED_INTAKE_DEPLOYMENT_READINESS_GATE.md`.
- Added readiness helper at `api/deployment/protectedIntakeDeploymentReadiness.ts`.
- Added deployment gate and release checklists under `ops/deployment/`.
- Added remote operator checklist.
- Documented safe production green state for main.
- Kept protected intake and persistence disabled by default.
- Did not add a Supabase migration.
- Did not connect live website forms.

## QL-016 — Deployment Runtime Wrapper Selection

Goal:

- Choose the actual runtime wrapper for the protected intake endpoint.
- Add the wrapper for Vercel or Cloudflare only after the deployment target is confirmed.
- Keep live intake disabled until dry-run tests and persistence review are complete.

## QL-017 — Phone/SMS Provider Test Decision

Goal:

- Choose a test number approach.
- Compare VoIP.ms, Telnyx, Twilio, FreePBX/Asterisk, and 3CX again with real workflow needs.

Setup will be needed here for a test number or phone provider account.
