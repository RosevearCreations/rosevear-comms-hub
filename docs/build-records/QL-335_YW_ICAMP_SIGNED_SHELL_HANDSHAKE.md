# QL-335 — YW & iCamp Shell-Level Signed Nonproduction Handshakes

**Date:** 2026-11-04 · **Scope:** Comms Hub, YW, iCamp and the authorized master Supabase project.

## Implemented source-owned contract

- Source routes are separate from existing tenant-scoped v1 URLs:
  - `GET /api/integration/v1/shell/health`
  - `GET /api/integration/v1/shell/capabilities`
- Exact source map: Comms `yw` → Yard Workers `yard-workers`; Comms `icamp` → iCamp `icamp`. They are *platform shell* identities, not Rosevear Landscaping or Camp Rosevear tenant identities.
- Broker request is an Ed25519-signed canonical JSON challenge, carried in `X-Rosevear-Shell-Envelope` base64url, with `rosevear.shell.nonproduction.v1`, broker issuer `ai-data-platform`, expected source audience, exact GET path and matching `read_shell_health`/`read_shell_capabilities` scope, verified workload UUID, manifest hash, separate original owner and source-owner TEST receipt hashes, 90-second nonce and immutable nonproduction environment.
- Source runtime checks original proof gates, independently pinned broker key, path/shell identity, time window and a durable atomic nonce-claim callback; only then may a separately attested source KMS sign the exact read-only `AUTHENTICATED_READONLY_TEST_HELD` receipt. Broker verifies independently pinned source signature, receipt body and one-time nonce before counting TEST authentication.
- No customer/child data, automatic communications, tenant grant, source write or production access is implied by a successful signed shell TEST.

## Live evidence and boundary

**Private state: 0/2 authenticated; both HOLD.** Independent original source signers, managed handles, verified broker workload, approved owner/source TEST decisions, pinned nonproduction origins and durable nonce services are absent in the master. There was no real source-to-broker private network handshake. Test-generated Ed25519 keys are only local fixtures, not real credentials or original authority.

The source routes intentionally return a non-200 HOLD until independently authorized trust and KMS/nonce adapters are deployed. Do not convert a 503/403 into connected state, switch to production, create synthetic source-owner signatures or use a company/campground tenant secret as a platform key.

## Database migration and verification

- Authorized project: `gxujcwpktaickcgzyvnu` (RosevearCreations connection).
- Applied: `20261104233842_ql335_shell_readonly_handshakes.sql` after transaction-wrapped dry-run/rollback and confirmation that neither table remained.
- Private tables: `master_shell_handshake_profiles` (two HOLD rows), `master_shell_handshake_receipts` (zero rows, append-only evidence trigger). FORCE RLS; PUBLIC/anon/authenticated privileges revoked.
- Both rows have `pinned_origin=NULL`, `broker_workload_id=NULL`, `source_issuer_record_id=NULL`; this is expected, not a migration error.
- Rollback (only if no signed evidence exists and after backup/owner review): archive profile details, then in a *separate authorized migration* drop `master_shell_handshake_receipts` and `master_shell_handshake_profiles`; do not alter QL-331–334 identity/audit tables. Do not drop tables or evidence automatically.

## Verification and go/no-go

1. `node --test runtimes/shell-handshakes/protocol.test.mjs` — local broker/source pair, replay and wrong shell/child/origin gates.
2. YW: `node --test tests/ql335-shell-nonproduction.test.mjs` — source signer, live-route fail-closed and negative tests.
3. iCamp: `node --test tests/build202-ql335-shell.test.mjs`; Next lint/typecheck/build when dependencies available.
4. Comms Hub: `npm --prefix app run check`, Vitest QL-335 UI, build and source-linked owner panel.
5. GitHub required checks on **all three** `dev` → `main` PRs, actual main deployments and source HTTP route status checked independently. Production GREEN for release code does **not** change private connection HOLD.

**Activation dependencies (not a substitute for a migration):** independent source-owner verified signer/key custody, owner TEST and source-owner TEST decisions, verified broker workload, pinned nonproduction HTTPS origin, durable atomic nonce store, independently attested source and broker KMS sign callbacks, signed original source receipt from a real GET, broker-replayed verification. Any non-HOLD connection state requires a separately reviewed security/authorization migration.

**Next planned:** QL-336 — Rosie Dazzlers & Devil n Dove Reusable Child-Shell Identity Migration, Signed Read-Only Contract Preparation.
