# QL-332 — Managed Custody and Rotation Control Release Receipt

## Reviewed implementation

- Code PR [#640](https://github.com/RosevearCreations/rosevear-comms-hub/pull/640) contains QL-332 private managed-handle schema, source-issuer fingerprint pinning, workload attestation records, serialized bounded dual-key rotation coordinator, append-only custody receipts, fail-closed emergency revocation and read-only I.T./Management/Status readback.
- Code and SQL migration PR merged into **main** commit **a0eaa5873d578534220baca948817ab2d258c9a5** after exact PR head `298ba8a8242754264d506020a7c81d01e4e1f7b3` passed app CI and Cloudflare Workers builds.
- Private rotation engine tests: **10/10 PASS**. New operator UI tests: **6/6 PASS**. QL-171 browser boundary tests: **11/11 PASS**. TypeScript and production build PASS; asset budget PASS (JS **3,137,766 B**, gzip **679,567 B**; CSS **449,638 B**, gzip **80,665 B**).
- Local full-suite run was resource-constrained and stopped after timeouts in existing tests; the two affected files independently retested **135/135 PASS**. The independently run protected GitHub suite is the release gate.

## Actual existing Supabase project and migration

Selected existing Comms Hub Supabase **rosevearcreations Project**, ref `gxujcwpktaickcgzyvnu`.

- Applied migration **20261104040000** (`ql332_managed_custody`) through the authenticated Supabase migration tool. The source-controlled version is [exact SQL](../../supabase/migrations/20261104040000_ql332_managed_custody.sql); the human review mirror is [0010](../../database/migrations/0010_ql332_managed_custody.sql).
- Five new private custody tables verified **ENABLE + FORCE RLS**. All five have no anonymous/authenticated SELECT, INSERT, UPDATE or DELETE privilege. No browser policies or public key-resolution RPCs.
- Direct table counts: **0 workloads, 0 issuer pins, 0 managed handles, 0 rotation jobs, 0 custody receipts**. Existing QL-331: **0 Auth users, 0 master principals, 0 shell grants, six held source rows**.
- Same-shell compound foreign keys for previous/candidate rotation handles and custody receipts directly verified. `master_custody_receipt_no_edit` trigger enabled.
- Supabase security advisor: no high-severity findings; six INFO `RLS Enabled No Policy` notices are intentional for server-only custody plus the previous private audit table. Performance advisor reports no unindexed QL-332 foreign keys; the old unrelated synthetic-conversation FK notice remains.

## Release security and deployment gates

The SQL creates **no** root trust key, private sign key, user account, token, live peer, grant or credential. Supabase Vault 0.3.1 is installed but a production managed-key envelope and independently attested broker are not. The private rotation engine is *not* deployed as a scheduled worker or authorized to call peers. Therefore **key custody = HOLD**, **connections = 0/6 DISCONNECTED / HOLD**, **Windows relay = OFF**, **ACK = UNDER_REVIEW / PARKED_FOR_LATER**.

Positive real managed-service encrypt/decrypt/sign, original source-owned Proof-B, owner/source-owner TEST authorization, two-sided production signature receipts, master MFA, child grants and device acceptance are still **PENDING**. Unit-test mock providers are not substitutes.

### Independent exact-main production evidence

- [Build disabled preview](https://github.com/RosevearCreations/rosevear-comms-hub/actions/runs/41771052667): **SUCCESS**; the matching deploy job **SUCCESS**.
- [Exact-main app CI #41771052661](https://github.com/RosevearCreations/rosevear-comms-hub/actions/runs/41771052661): **SUCCESS** — **150/150 test files, 1,409/1,409 Vitest tests**, private rotation Node tests, QL-171 browser baseline, TypeScript, production build and asset budget passed.
- Exact-main **Supabase Preview SUCCESS**, **Workers Builds SUCCESS** and public Cloudflare Worker serves the reviewed disabled-preview bundle.
- [Public asset parity workflow #41771052699](https://github.com/RosevearCreations/rosevear-comms-hub/actions/runs/41771052699): **SUCCESS**, independently rebuilt exact `main` SHA **a0eaa5873d578534220baca948817ab2d258c9a5** and retrieved public origin `https://rosevear-comms-hub.devilndovelive.workers.dev`.
- Public CSS `index-BzhkgloR.css` SHA-256 **78a6891791549d3fb6966cc914d227e6227c010c49a5103d7a7ef6568145011c** matched independently built CSS.
- Public JS `index-Db5rGt8l.js` SHA-256 **c868ba61d64d31cde664a87c9797f20355468b5dcf5dfbb823578cf2d8175192** matched independently built JS.
- Static parity verified public Worker HTML/JS/CSS only. **0 source GET, 0 writes, 0 secret reads, 0 provider connections, 0 ACK sends**.

All six exact-main release checks completed **SUCCESS**, including app-build, Build disabled preview, Deploy disabled preview, Supabase Preview, Workers Builds and independent public JS/CSS parity. **QL-332 software and database metadata Production GREEN**. This evidence does **not** establish real key custody.

Next authorized numbered work, **only upon a separate owner request**: **QL-333 — Six-Source Contract Discovery, Signed Manifest Pinning & Identity Compatibility**. No automatic QL-333 code work or source activation is implied.
