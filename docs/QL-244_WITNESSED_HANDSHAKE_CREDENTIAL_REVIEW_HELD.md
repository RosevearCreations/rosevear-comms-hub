# QL-244 — Witnessed nonproduction handshake and owner review HOLD

Status: **implementation-ready, no live connection or real owner authorization**.

## Delivered

- Offline Ed25519 verifier for a distinct fourth assessor public-key pin; checks QL-243 prior signer/audit/identity bundle, SHA-256 digest of exact QL-243 report, six separately keyed metadata rows and seven negative-denial claims.
- Fresh, owner-signed **conditional review request** checked against separately pinned owner key and rollback metadata, strictly disallowing an approval decision.
- Six-app metadata ledger in Comms Hub, with a disabled-preview four-company HOLD matrix, source-drift detection and no browser network/storage/credential handling.
- New independent evidence request in `ROSEVEAR_INTEGRATION_V1_QL244_WITNESSED_HANDSHAKE_HANDOFF.md`.

## Limits and blockers

The verifier can prove signature matches to supplied public key pins; it cannot prove keys were independently pinned, that an assessor actually observed a gateway, that any secret exchanged, that an audit survived backend restarts, that a real person signed, or that the owner gave permission. No gateway provisioning or production connector activation is in scope. Real owner decision remains **NOT GIVEN**, all companies **DISCONNECTED**, QL-181 **12/12 HELD**.

## Acceptance tests

Run `node scripts/__tests__/ql244-witnessed-handshake-review.test.mjs`, `npm run check`, `npm test`, and `npm run pages:build` in CI. Signed fixtures are synthetic keys only. A GREEN `main` release denotes shipped *disabled-preview code*, never live integration.
