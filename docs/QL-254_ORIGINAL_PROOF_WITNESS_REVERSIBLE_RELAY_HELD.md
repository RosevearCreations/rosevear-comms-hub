# Comms Hub QL-254 — original source-proof retrieval follow-up, independent private pin witness & reversible 24/7 relay readiness (HELD)

## Observed evidence

Public GitHub-only check ran **28 October 2026, 11:42 p.m. Eastern**, `2026-10-29T03:42:01Z`. The six checked `main` commits advanced from the QL-253 baseline and each still returned HTTP 404 at the exact QL-246 signed proof file location. Detailed immutable SHA table and companion actions are in [QL-254 six-app handoff](ROSEVEAR_QL254_SIX_APP_ORIGINAL_PROOF_WITNESS_PRIVATE_RELAY_HANDOFF.md). This is a dated immutable source snapshot, **not** current deployment status or an assertion that newer SHAs are also missing proof.

## Changes

1. `scripts/ql254-proof-followup-witness-relay.mjs` reconciles six ordered original GitHub public results with the QL-253 SHA baseline. It distinguishes actual HTTP 404 after code advancement, 404 at unchanged source, no-network requested and proof/CI exceptions, never conflating ordinary software deployment with real integration trust.
2. Its offline independent witness checker binds **a real Ed25519 signature** (synthetic keys only in tests) to a valid QL-253 registry challenge, exact A/B, business and tenant, registry snapshot, custody public pin, five-minute nonce digest and three distinct receipt IDs. It rejects expired/replayed/mismatched/extra-field, foreign-tenant, key-reuse and signature-tampering claims. Even matching signatures return `PRIVATE_REGISTRY_WITNESS_SIGNATURE_MATCHED_INDEPENDENT_IDENTITY_STILL_HELD` because out-of-band signer identity and custody cannot be proven by this application.
3. A disabled-only `ROSEVEAR_AI_HUB_PRIVATE_RELAY_CANDIDATE` plan supports a **four-event in-memory reversal rehearsal**: baseline disabled → simulated enable → simulated stop → rolled back disabled. It strictly rejects live starting, public inbound, vault/camera access, repository secrets, cross-tenant exposure, credential exchange, owner approval claims and missing stop/restore procedures. No Windows service, task, VPN, host, gateway or credential was accessed or modified.
4. Operator QL-254 review panel shows the dated six-app 404 follow-up, proof-source action, witnessed key custody caveat and private relay disable/rollback readiness. Script `integration:ql254-public-proof` defaults to no network; only explicit `--public-get` calls the allowlisted public GitHub endpoints used by QL-249. CI adds the QL-254 fail-closed tests; Worker is source-only redeploy marker.

## Release boundary

App CI and production promotion may become **GREEN** independently while all six real interconnections remain **DISCONNECTED / HELD**. There are no original verified QL-246 proofs, independent trusted signer pins, authenticated TEST-only owner decisions, real permitted GET windows, authentic gateway seven-denial receipts or 24/7 relay deployment. `ownerTestAuthorization = NOT_GIVEN`, pilot approval `NOT_GIVEN`, 12/12 live gates HELD, 0 live GETs, 0 writes, 0 calls, 0 SMS and 0 dispatch.

**Next candidate:** QL-255 — Six-App Verified Proof Publication Disposition, Private Witness Custody Exception Closure & Bounded Mini-Server Trial Approval Preparation (HELD).
