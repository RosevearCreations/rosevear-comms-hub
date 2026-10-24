# QL-184 — Brand Workspace Permission Mapping

**Status at authoring:** synthetic architecture and owner/security review candidate. This document does not enact grants or certify privacy/security. Production GREEN requires separate exact-main CI and published Pages verification.

## Scope

Provide an independently *reviewable* least-privilege blueprint for two business contexts: **Rosie Dazzlers** (`rosiedazzlers`) and **Devil n Dove** (`devilndove`). Operators can inspect the blueprint at **Operator workspace → Safety & hold review → QL-184 Brand workspace permission blueprint**. The selectable identity, roles, assignments and requests are examples only; no actual operator accounts, customer identifiers, session credentials or private line data are loaded.

Actual runtime allowed = **false for every result**, even when a role/scope/action combination shows `DESIGN_ALLOWED_RUNTIME_HELD`. The 12 QL-181 pilot prerequisites remain `HELD_UNVERIFIED`. QL-184 does not change Supabase RLS, grants, allowlist rows, roles, authentication, telephony, customer export, recordings, retention or approval flows.

## Existing access surfaces and gaps

| Repo surface | Existing behaviour | Security conclusion / follow-up |
| --- | --- | --- |
| `app/src/supabase/appAdmin.types.ts` | Defines `owner`, `admin`, `staff_readonly`, `active`, and `brand_scope: string[]`. | Shared TypeScript vocabulary, **not** proof of server-enforced brand isolation. |
| `app/src/auth/AdminSessionGate.tsx` | Optional Supabase magic-link/session check and active `app_admins` email lookup; local-only fallback renders demo without login. | Verify server-confirmed identity, MFA, revocation and exact resource/brand rights independently. Client `getSession` and client-side role selection alone are insufficient for private operations. |
| `app/src/supabase/readModel.ts` | Optional brand/reference and allowlist reads; fallback local when disabled. | Future private reads require exact server role/scope and per-row RLS negative tests, not the general reference-read path. |
| `supabase/migrations/20261010154500_ql087_app_foundation.sql` and `20261010205200_ql090_public_read_only_views.sql` | Public *synthetic-only* samples and readiness rows are intentionally readable by `anon`/`authenticated`; QL-090 views use `security_invoker=true`. | These public samples must never be mixed with a future private customer table. Public preview access cannot be treated as authorization for private data. |
| `app/src/storage/localRepository.ts` | Older QL-004 browser-local demo can store/import/export lead-looking entries. | **Not approved** for private customer data; block real entry and review in QL-185 data minimization/retention design. |
| `app/src/operator/ql181PrivacyPilotGate.ts` | QL-181 shows a smaller mock capability matrix and all 12 pilot holds. | QL-184 expands the reviewable *future* resource/role map; it cannot clear QL-181 holds. |

An older QL-008B migration is represented by a history-adoption SQL stub; do not infer current remote policy correctness from the presence of the file. QL-184 deliberately performs **no live Supabase query** and claims no independent server security acceptance.

## Proposed same-brand operation matrix

`staff_readonly` can *propose* only read access to minimized same-brand inbox/contact/intake/task information. `admin` adds mock triage/draft/intake/task preparation. `owner` adds audit-summary read and a **request-for-review** for role changes; that is not an actual grant. Every row additionally needs a separate explicit assigned-brand membership, active brand matching the requested brand, server-verified identity, resource/record ownership and a future reviewed backend authorization layer.

| Example operation | Staff read-only | Admin | Owner | Actual runtime |
| --- | --- | --- | --- | --- |
| Same-brand inbox metadata read | Proposed | Proposed | Proposed | **HELD** |
| Internal queue triage proposal | Denied | Proposed | Proposed | **HELD** |
| Minimized contact context read | Proposed | Proposed | Proposed | **HELD** |
| Prepare **unsent** draft | Denied | Proposed | Proposed | **HELD** |
| Prepare internal intake | Denied | Proposed | Proposed | **HELD** |
| Propose task assignment | Denied | Proposed | Proposed | **HELD** |
| Same-brand audit summary | Denied | Denied | Proposed | **HELD** |
| Propose role change for separate review | Denied | Denied | Proposed | **HELD** |
| Export real customer records | Denied | Denied | Denied | **HELD** |
| Dispatch live phone/SMS | Denied | Denied | Denied | **HELD** |
| Authorize pilot / owner exception | Denied | Denied | Denied | **HELD** |

`signed_out` has no *proposed private* capabilities, regardless of assigned-brands selection. Existing **public synthetic** sample read is a separate surface. Even a two-brand owner may only evaluate a record in the currently active brand context; switching the context is explicit, not an automatic permission to traverse into the other brand.

## Future enforcement architecture — no implementation authorization

1. **Identity:** Future backend must independently verify authenticated sessions, active app-admin membership, MFA/step-up where required, session revocation and identity binding. Never treat UI role selectors or user-editable JWT `user_metadata` as trusted authorization claims.
2. **Tenancy:** Every private record needs immutable internal business ownership (`brand_id`) and resource-level predicates. Match the requested resource's brand to the server-verified allowed brand set **and** the selected workspace context. Never accept a client-provided `brand_scope` as proof. Validate object IDs and related joins to prevent broken object-level authorization (IDOR/BOLA).
3. **Operations and fields:** Separate `read_metadata`, minimized-contact read, proposed draft/intake/task edits, assignment, audit and role-change review. Keep provider dispatch, customer bulk export, role grants and real owner authorization outside this blueprint, subject to explicit new builds and approvals.
4. **Database:** Independently review `GRANT` and `REVOKE` along with per-table `RLS`, policy `TO` roles, `USING`/`WITH CHECK` for writes, and `security_invoker` for exposed views. A generic `TO authenticated` policy or `is_app_admin()` role check without a **per-brand/per-record** predicate is not sufficient. Respect current Data API exposure settings: new tables may require explicit grants.
5. **Confidentiality:** Use only backend-private service credentials. Design redaction/field-level minimization, retention, access logs, negative tests and rollback before any private data is accepted. The public synthetic QL-087/090 views and QL-004 localStorage import/export must remain separated from future private flows.
6. **Independent acceptance:** External security/database reviewer must verify actual roles and RLS in an isolated staging environment with both businesses, no-assignment/signed-out cases, malformed record IDs, owner/admin/staff boundaries, inactive/revoked operators, session expiry, simultaneous-context switching and cross-brand joins. Owner must explicitly authorize the exact pilot separately after every QL-181 prerequisite is resolved.

QL-184's deterministic test suite exercises all role × business × operation combinations in memory and rejects malformed or foreign scope requests. These are **blueprint invariants**, not evidence of real server authorization, penetration testing, accessibility certification or real operator acceptance.

## Reference points for independent review

- [Supabase — Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Data API grant and exposure changes](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [OWASP API1:2023 — Broken Object Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- Local verified baseline: `docs/QL-181_PRIVACY_ROLES_LIVE_PILOT_DECISION_MATRIX.md`, `docs/QL-183_OPERATOR_USABILITY_ACCEPTANCE.md`.

## Release and queue gates

- Run `npm run check`, `npm test`, `npm run build`, and `npm run pages:build` in `app`.
- Run `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs` and `node scripts/__tests__/ql170-release-receipt.test.mjs`. Confirm `supabase-mutation=0`, `raw-network=0`, and no live calls/SMS/approvals.
- Merge feature → `dev` → `main` in order, then confirm exact-main `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview` and `Workers Builds: rosevear-comms-hub` are all `completed/success`. Verify the public Pages HTML and new compiled JS marker `ql184-brand-workspace-permission-blueprint-v1` both return HTTP 200.
- After verified QL-184 GREEN, **6 proposed builds remain** from QL-185–190. All 12 live-pilot gates remain held.
