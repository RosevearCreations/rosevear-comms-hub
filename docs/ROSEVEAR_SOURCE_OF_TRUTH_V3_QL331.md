# Rosevear Suite — Source of Truth v3 (QL-331 Master Foundation)

**Dated:** 2026-11-03. Use exact source and deployed evidence for current operational states; do not replace the historical [v2 snapshot](ROSEVEAR_SOURCE_OF_TRUTH_V2_2026-11-03.md).

## Selected identity authority

The existing Comms Hub Supabase `rosevearcreations Project` (`gxujcwpktaickcgzyvnu`) is the approved QL-331 **registry** location, not a merged customer database. Supabase Auth verifies the user; `public.master_principals` binds exact user IDs to independently granted master roles; `master_shell_grants` and PostgreSQL RLS restrict shell and child reads. **No user-metadata or email text can substitute for Auth + an active database grant.**

Preflight: Supabase ACTIVE_HEALTHY; **0 Auth users**, 1 legacy owner allowlist row in `app_admins`, 0 matching authentic owner users. QL-331 must not silently create a privileged identity or self-enroll anybody.

| Shell / support ID | Source ID | Layer | Child boundary | External peer status |
| --- | --- | --- | --- | --- |
| `yw` | `yard-workers` | YW **platform** shell | Landscaping companies are children | DISCONNECTED / HOLD |
| `icamp` | `icamp` | iCamp **platform** shell | Campgrounds are children | DISCONNECTED / HOLD |
| `rosiedazzlers` | `rosiedazzlers` | Future multi-detailer shell | Existing owned Rosie as future first child, not provisioned | DISCONNECTED / HOLD |
| `devilndove` | `devilndove` | Future multi-maker shell | Existing owned Devil as future first child, not provisioned | DISCONNECTED / HOLD |
| `ai-data-platform` | same | Support broker | No customer tenant | DISCONNECTED / HOLD |
| `rosevear-ai-hub` | same | Windows/local support | No customer tenant; relay OFF | DISCONNECTED / HOLD |

Comms Hub is a shared communications service, not a master identity issuer. All six peer source connections remain **0/6**. Original signed Proof-B, source owner TEST, managed vault, customer grants, outbound sends and ACK are not established by a schema deployment.

**QL-331 output:** additive master_* database tables with RLS, source-controlled migration, verified-auth SELECT-only optional UI, true negative database authorization tests, and no fabricated owner. [Implementation/owner bootstrap](QL-331-MASTER-IDENTITY-AND-SHELL-RLS.md).

**Next:** QL-332 managed vault/key custody and eventual real owner/master enrollment, then QL-333–340 signed source connection, isolation and client portal/reporting pilots. Software code GREEN, DB migration GREEN and real connected sources are three **separate** status claims.

## Verified QL-331 post-migration state

The master SQL is **actually applied** in Comms Hub Supabase project gxujcwpktaickcgzyvnu, as migrations 20261104023753 (ql331_master_shell_auth_rls) and 20261104023949 (ql331_master_fk_index_hardening). The exact applied SQL is source tracked under supabase/migrations/ and database/migrations/0008–0009; PR #638 reconciled remote migration history after an initial Supabase Preview failure.

Five new master tables have FORCE RLS, four business shells and two supports, all DISCONNECTED / HOLD. Master principals, child tenants, delegated grants and audit evidence are all zero rows. No actual Supabase Auth user is enrolled. Anonymous SELECT and authenticated writes to master tables are denied, and a simulated unregistered subject sees zero master shell rows.

QL-331 CI: 1,403/1,403 tests, QL-171 safety, TypeScript and bundle budget PASS. Public Worker assets match exact source hashes. Next QL-332 addresses vault/KMS bootstrap, but external app connections stay 0/6 without authentic owner/source authorization.
