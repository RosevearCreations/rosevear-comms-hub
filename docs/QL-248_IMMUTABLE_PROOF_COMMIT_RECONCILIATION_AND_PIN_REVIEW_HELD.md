# QL-248 — Immutable proof-commit reconciliation and independently pinned source review (HELD)

**28 October 2026 · Rosevear Comms Hub · nonproduction, public metadata only.**

## Source protocol discrepancy discovered

The six-app AI Data Platform QL-246 handoff currently requires the `source_revision` field inside `docs/integration/ql246-source-proof.json` to equal the SHA of the Git commit **containing that file**. This cannot be satisfied by a normal Git commit: editing the file to add its containing commit's hash changes the file, which changes the commit SHA. A fixed-point commit SHA is not an operational procedure. No application should invent a SHA or pretend a self-referencing signed proof exists.

**Proposed QL-246 transport clarification (requires agreement by each consumer):**

1. `source_revision` remains the immutable **earlier source/test commit SHA** and is bound into the exact existing QL-246 signed payload.
2. A later **proof-bearing commit SHA** identifies where the unchanged signed JSON can be independently fetched. This separate SHA stays *outside* the signed file in the independent operator's trusted manifest; it is not a new signed payload field.
3. Record the SHA-256 of the raw proof bytes, current 40-character proof commit SHA, earlier audited source SHA, source CI URL and per-app Ed25519 SPKI fingerprint in independently collected operator evidence.
4. If the code, tested gateway or business/tenant mapping changed between those commits, the reviewer must inspect the diff and re-run affected evidence. The existence of a valid signature does not prove the earlier tested source is still what is deployed.
5. The AI Data Platform QL-246 verifier and every dependent consumer must explicitly approve this clarification before it can be considered contract-compliant. QL-248 does **not** silently rewrite any other repository's contract or declare a proof accepted.

## Software delivered

- `scripts/ql248-proof-commit-reconciliation.mjs`: a strictly offline, deterministic raw-byte digest and Ed25519 verifier for six *presented* public QL-246 envelopes, each bound to an older source SHA and newer proof-bearing SHA.
- `scripts/ql248-verify-source-proof-bundle.mjs`: command-line file reader; zero I/O without arguments, bounded inputs, no network or secret store, sanitized output only.
- The source verifier checks each original QL-246 field, exact allowed GET paths/methods, signed negative-test claims, all false owner/external-GET/audit assertions, environment, source-revision/CI/tenant binding, one-hour expiry, six **distinct** public signer pins, pinned raw-byte digests and signatures.
- The operator panel explains the two Git SHAs and shows 0/6 independent approvals. It **cannot** fetch local files or use an API credential.
- Tests cover legitimate offline signatures, self-referencing proof denial, tampering, wrong signer, cross-tenant/writes/owner claim, expiry, duplicated keys and partial six-app packets.

## What a passing offline result does and does not mean

`SIX_OFFLINE_SIGNATURES_MATCHED_REAL_GATEWAY_PROOF_PENDING_HELD` means only that six supplied raw public JSON files were cryptographically consistent with **separately supplied pin records**, and their source/proof SHA relationships were structurally valid. It does **not** prove the operator actually sourced those files or pins independently from GitHub, that source CI is green, that public key custody is authenticated, or that the seven signed negative-test claims were truly witnessed. These require separate authenticated retrieval and independent review.

At the observed QL-247 snapshot, all six source-proof files were missing. **No real files have been provided to this verifier, and no source has been independently accepted under QL-248.** Do not use generated test fixtures as evidence.

| Gate | QL-248 decision |
| --- | --- |
| GitHub account access | Verified for six companion repos in QL-247; not service authentication |
| Distinct source/test SHA and proof commit SHA | Verification code ready; real source returns missing |
| Raw proof + independently sourced public Ed25519 fingerprint | Software check ready; genuine six-app pins missing |
| Actual HTTP health/capabilities and negative tests | Not independently witnessed |
| Genuine durable source audit and rollback | Not independently witnessed |
| Tenant-specific credentials and nonproduction transport | Not provisioned here |
| Owner-signed narrow pilot approval | **NOT GIVEN** |
| Four-business connections and 12 communications pilot gates | **DISCONNECTED / HELD** |

No HMAC credentials, household topology, customer data, Etsy/Marketplace writes, booking payments, employee/payroll data, campsite gates, device actuation, real SMS/telephony or dispatch may be exchanged, logged or activated through this tool.

See [the QL-248 six-app handoff](ROSEVEAR_QL248_PROOF_COMMIT_AMENDMENT_HANDOFF.md) for the shared amendment request and sample offline input contract.

**Next expected Comms Hub build: QL-249 — Six-App Immutable Proof Publication Retest, Independent GitHub Origin Attestation & Owner-Scoped Nonproduction GET Scheduling (HELD).**
