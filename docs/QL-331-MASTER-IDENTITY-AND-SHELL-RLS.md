# QL-331 — Master Auth, Shell Registry and Row-Level Tenant Boundaries

**Selected project:** the existing RosevearCreations Comms Hub Supabase `rosevearcreations Project` (`gxujcwpktaickcgzyvnu`). This is a master **registry** foundation, not a shared cross-business customer database.

**Actual preflight, 2026-11-03:** project ACTIVE_HEALTHY, 0 registered Supabase Auth users, 1 legacy active owner row in `public.app_admins`, 0 verified Auth-owner matches. An email allowlist is NOT a signed-in master. Never create a fabricated user, owner grant, issuer attestation or signed source approval.

## Implemented foundation

The source-controlled [additive QL-331 SQL migration](../database/migrations/0008_ql331_master_shell_rls.sql) defines five new isolated `public.master_*` tables:

| Table | Purpose / restriction |
| --- | --- |
| `master_principals` | Auth user UUID, role, active flag, original enrollment evidence digest; no owner seeded |
| `master_shell_registry` | Exactly four business platform shells + two tenantless supporting services, all `DISCONNECTED / HOLD` |
| `master_child_tenants` | Compound (shell, source-issued child ID) identity; no example customers are seeded |
| `master_shell_grants` | Separate evidenced, expiring shell/child permissions; a master principal never implies child access |
| `master_security_audit` | Future server-only signed change receipts; no fake events |

All five have ENABLE and FORCE RLS. Anonymous access is revoked. Authenticated access is SELECT-only to four metadata tables; audit is not client-readable. Exact `auth.uid()` is checked against separately approved active membership and grant rows; there are no public INSERT, UPDATE or DELETE policies, no SECURITY DEFINER routine and no use of editable JWT user metadata.

The nonsecret registry maps canonical `yw` to source app ID `yard-workers`, iCamp to the platform shell and future Rosie/Devil reusable shells to their existing application IDs. Children such as Camp Rosevear or Rosevear Landscaping are illustrations **only** and have no provisioned database access.

The [QL-331 browser readback](../app/src/operator/ql331MasterAccess.ts) calls `auth.getUser()` **only at operator request** (not `getSession()`), then performs SELECT-only reads from the RLS-protected registry. It never uses a service role key. The [master UI](../app/src/operator/Ql331MasterControl.tsx) is visible in I.T. Command, Management and Status; in disabled-preview mode it remains `CLIENT_DISABLED`, with no customer or source access.

### Actual owner enrollment still required

1. A legitimate owner creates/signs into a **real verified Supabase Auth identity** in the selected project. There were **zero** such users at preflight; we do not invent one, send an unapproved invitation, or treat a legacy allowlist row as authentication.
2. An independently authorized private enrollment service validates that identity and the genuine owner decision, then records `master_principals(user_id, master_role, active, enrollment_receipt_digest)` with the exact signed Auth UUID. There is no public self-enrollment route.
3. Source-specific shell grants require separately attested `master_shell_grants` entries. Child reads require a real, source-owned child UUID **plus** a matching ACTIVE `child_read` grant. Owner or master status alone does not grant access to a child.
4. Once the existing optional publishable-key Supabase client is approved/configured, a signed-in operator can click "Verify authenticated master session" and inspect only rows the database RLS actually returns. A public SPA still needs its one-time nonsecret URL and publishable key; **no new secret or per-child environment variables** are introduced.

### Database acceptance to verify after applying migration

Confirm six nonsecret shells (four business / two support) with HOLD states; zero principals, children, grants and audit events; five FORCE RLS tables; no anonymous grants; SELECT-only grants for authenticated metadata; and actual anonymous/unregistered-user reads returning zero rows. Check Supabase security advisors.

**Positive owner sign-in, MFA and owner/child authorization tests remain PENDING** until an authentic user exists. A zero-user database cannot legitimately prove an enrolled principal.

### Recovery / rollback

Only new, isolated tables are added; no pre-existing contacts, messages, app_admins or auth.users rows are changed. If migration or verification fails, freeze enrollment and record the failure. A destructive rollback is NOT automatic: first preserve genuine later membership/grant/audit receipts, review dependencies and approve a down migration. Do not drop identity history to make a CI gate appear green.

**Remaining:** master owner enrollment, vault/KMS (QL-332), six signed peer tests, source owner approval, child consent/grants, physical-device acceptance. External sources remain `DISCONNECTED / HOLD`, relay OFF, ACK UNDER_REVIEW/PARKED_FOR_LATER.

References: [Supabase Auth Users](https://supabase.com/docs/guides/auth/users), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Security](https://supabase.com/docs/guides/security/product-security), [previous Source of Truth v2](ROSEVEAR_SOURCE_OF_TRUTH_V2_2026-11-03.md).
