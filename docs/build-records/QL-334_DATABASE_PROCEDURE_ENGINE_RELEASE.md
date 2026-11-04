# QL-334 — Database-Driven Procedure Engine, Safe Workflow Scheduler & Approval Ledger

**Date:** 2026-11-04 (America/Toronto)  
**Owner:** Rosevear suite  
**Mode:** PRIVATE PROCEDURES HELD; public discovery is available.

## What was built

1. Seven private PostgreSQL tables: `master_procedure_versions`, `master_procedure_decisions`, `master_procedure_schedules`, `master_procedure_jobs`, `master_procedure_job_events`, `master_procedure_breakers`, and `master_procedure_connection_links`. All use **FORCE RLS**, with no browser/Data API grants or policies. Approval and job-event receipts are insert-only, guarded by triggers.
2. Three versioned draft procedure templates per canonical shell (18 in all): read-only connect, client-portal tracking, and management reporting. Eight fixed trust/scope steps may not be removed; optional checks create a new revision instead of replacing an approved one. No procedure is approved or active.
3. Server-only deterministic safety engine and a parameterized PostgreSQL transaction adapter. The scheduler uses workload attestation, `FOR UPDATE SKIP LOCKED`, two-minute claim leases, idempotency constraints, bounded backoff, a breaker and dead-letter state. **All six schedules are disabled**; no unverified workload can claim a job.
4. A public operator **Connect the Rosevear suite** centre with six source links, per-app manifest paths, existing integration pages where verified, guidance, recovery stages and an honest connection counter. This client never loads private approval records, secrets or customer data.
5. The six original source manifests' current bytes and main-commit digests were independently observed and recorded under QL-333 as `DISCOVERED_UNSIGNED`. This is public metadata only, not source-owner Proof-B or signed authority.

## Open the connection centre

- [Rosevear Comms Hub](https://rosevear-comms-hub.devilndovelive.workers.dev/) — in the I.T./connections section.
- [Yard Workers](https://github.com/RosevearCreations/yw/blob/main/public/.well-known/rosevear-integration-manifest.json) — public source descriptor.
- [iCamp](https://i-camp-pi.vercel.app/integration/comms-hub) — existing application connection page.
- [Rosie Dazzlers](https://github.com/RosevearCreations/rosiedazzlers/blob/main/.well-known/rosevear-integration-manifest.json) — public descriptor; admin integrations page is inside the Rosie application.
- [Devil n Dove](https://github.com/RosevearCreations/devilndove-site/blob/main/.well-known/rosevear-integration-manifest.json) — public descriptor; admin I.T. integrations page exists.
- [AI Data Platform](https://ai-data-platform-beryl.vercel.app/app-connections) — existing application connections registry.
- [Rosevear AI Hub](https://github.com/RosevearCreations/rosevear-ai-hub/blob/main/apps/web/public/.well-known/rosevear-integration-manifest.json) — local Windows server descriptor; private relay remains OFF.

The existing source pages are *connection information*, not live authenticated links. No live call, text, dispatch or private customer portal is enabled by QL-334.

## Database authority and safety

- Canonical database: Supabase project `gxujcwpktaickcgzyvnu`, selected in QL-331.
- Exact applied SQL: [`20261104175454_ql334_procedure_engine.sql`](../../supabase/migrations/20261104175454_ql334_procedure_engine.sql), confirmed present in Supabase migration history.
- SQL transactional dry run uses `BEGIN;` + migration + `ROLLBACK;`, then production apply through Supabase's migration runner.
- Reversal, **only if required and after confirming no real data exists**: disable schedules and remove the seven QL-334 tables in reverse dependency order, then drop `public.ql334_reject_evidence_mutation()`; preserve external QL-331–333 tables and all existing customer data. Never delete live approvals or original evidence as casual rollback.
- This deployment does **not** provision genuine Auth master users, a verified private broker, a source-signing issuer, managed key material or an external TEST consent. Until all exist, code refuses private claims and the database stores DRAFT/HELD rows only.

## Acceptance and operation

- Run `node --test runtimes/master-procedures/engine.test.mjs runtimes/master-discovery/manifest.test.mjs`.
- Run `npm --prefix app run check`, `npm --prefix app run test`, and `npm --prefix app run build`.
- Verify migration applied, seven tables FORCE RLS, six link/schedule/breaker rows, 18 draft versions, zero approvals, zero active schedules/jobs, and zero new `anon`/`authenticated` privileges.
- For release: protected `dev` → `main` PR checks, exact-main Cloudflare/Pages deployment and public JS/CSS parity. GREEN means released **software**, not private source trust.

## First actual private connection — prerequisites

1. Enrol an authentic, MFA-protected owner/admin master identity; obtain independent master authorization.
2. Receive original source-owned Proof-B and source signer/public key custody for the exact shell; independently verify against the pinned manifest. Child tenants are *not* standalone shell identities.
3. Attest a real private workload and managed key handle without inserting secret values into ordinary rows or public environment variables.
4. Receive separate source-owner and owner-scoped read-only TEST decisions; record signed original receipts.
5. Activate **one** reviewed version and a source-scoped schedule through a private authenticated gateway; run exact GET health/capabilities, validate nonce/response signature, record both-side receipts and monitor retries/quarantine.

**Verified before GitHub promotion:** migration `20261104175454` applied; 7/7 tables FORCE RLS with zero `anon` read or `authenticated` write; 6 public source pins, 6 connection links, 18 drafts, zero approvals/jobs/enabled schedules/workloads. Node safety suite 20/20 passed, Vite/TypeScript build passed, full client suite **151 files / 1,413 tests passed**. **Production promotion status:** verify the main-branch check and live asset parity separately before calling GREEN. **Connectivity status:** 0/6 private sources connected; all private scopes HOLD.

**Next build:** QL-335 — YW & iCamp Shell-Level Signed Nonproduction Handshakes (requires real trust and separate TEST consent).
