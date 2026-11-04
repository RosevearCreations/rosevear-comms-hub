# QL-331 — Master Auth, Shell Registry and Enforced RLS Release Receipt

## Exact source, CI and deployment

- [Code PR #637](https://github.com/RosevearCreations/rosevear-comms-hub/pull/637) merged application main commit **a994c1d6261522a95fb2e0d07e08feb7677222fb**.
- [Migration reconciliation PR #638](https://github.com/RosevearCreations/rosevear-comms-hub/pull/638) merged **3a2bf06c602df200463885f8bd197c73ea4aacea**. This corrected Supabase Preview's initial finding that the remote migration versions were absent from the GitHub migration directory. Corrected exact-main **Supabase Preview SUCCESS**, exact-main **app-build SUCCESS** and **Workers Builds SUCCESS**.
- Exact code PR tests **149/149 files, 1,403/1,403 tests PASS**, QL-331 focused **17/17 PASS**, TypeScript, QL-171 reviewed Supabase SELECT-only sink inventory and production bundle size checks PASS. QL-171: 388 source files, no raw network and no client-side mutations.
- Verified public [Cloudflare Worker](https://rosevear-comms-hub.devilndovelive.workers.dev/) HTML and JS/CSS byte parity on code main via [independent GitHub Actions checks](https://github.com/RosevearCreations/rosevear-comms-hub/actions). Public JS asset **index-UY_RTMQu.js** SHA-256 **056c6c8d11274a59bbe73d9e969c8a615b5cde3afb2299e8af183e5f86056b29**, CSS **index-D2K0PVk-.css** SHA-256 **c6dbfdfe862a6019e457f7af9a050f762e5bafa3bf2697e616c9ca0879e3c7b6**. These matched independently rebuilt assets. The final documentation commit must pass its own live parity check.
- Bundle metrics: JS 3,130,324 bytes, gzip 677,552; CSS 446,924 bytes, gzip 80,220; budget PASS. No speed improvement claimed.

## Actual applied database schema and read-only security

Selected existing Comms Hub Supabase **rosevearcreations Project**, ref **gxujcwpktaickcgzyvnu**. Two real applied tracked migrations:

1. Version **20261104023753**, name **ql331_master_shell_auth_rls** — [exact SQL](../../supabase/migrations/20261104023753_ql331_master_shell_auth_rls.sql).
2. Version **20261104023949**, name **ql331_master_fk_index_hardening** — [exact SQL](../../supabase/migrations/20261104023949_ql331_master_fk_index_hardening.sql).

The five master tables — master_principals, master_shell_registry, master_child_tenants, master_shell_grants, master_security_audit — were verified with **ENABLE + FORCE RLS**. There are six nonsecret held source registry rows (**4 business platform shells; 2 tenantless supports**), and **zero** owner membership, child tenant, grant and audit records. Auth users **0**, active grants **0**.

Supabase SQL permission inspection confirms **anon SELECT denied**, **authenticated INSERT/UPDATE/DELETE denied**, and authenticated SELECT only on four scoped metadata tables; audit remains unreadable from browser. A simulated unregistered auth subject sees **zero** shell rows, and an unset subject sees zero shell/child rows. Composite child and grant foreign keys enforce exact shell/child identity. Source-owned YW identity **yw → yard-workers**, iCamp **icamp** at shell layer.

Supabase post-migration security advisor had no high-severity findings. The INFO no-policy finding for private audit is deliberate: no client read access or policy. Performance adviser no longer reports unindexed foreign keys for QL-331 tables; one old unrelated synthetic conversation index warning remains.

## What Production GREEN means here

The source code, disabled-preview application, and **actual database RLS foundation** are production-deployed and independently verified. **This is not an operational master owner login.** Real Comms Hub Supabase has zero registered Auth users, and the old app_admins owner email allowlist row is not an authentic signed-in session. No user, enrollment receipt, tenant or approval was fabricated to obtain a green release check.

All six external connections remain **DISCONNECTED / HOLD**. No independent source Proof-B or exact owner/source-owner TEST was authorized; no private source GET, credential, KMS key, outbound message, child customer data or Windows relay was activated. Windows relay **OFF**; ACK **UNDER_REVIEW / PARKED_FOR_LATER**.

Next build: **QL-332 — Managed Vault/KMS, Peer Identity Bootstrap & Automated Rotation**. Source-owned authentication and a genuine owner identity are still prerequisites to live integration. Do not auto-queue further numbered work.
