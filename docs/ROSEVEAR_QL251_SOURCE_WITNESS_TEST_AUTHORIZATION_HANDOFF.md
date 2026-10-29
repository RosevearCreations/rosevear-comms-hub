# ROSEVEAR QL-251 — public source-proof return and independent witness/test authorization preparation

**Forward to:** AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp, Rosevear AI Hub. Do not send passwords, private keys, HMAC values, owner identity documents, customer records or private/home URLs.

QL-251 independently checked each public GitHub source on **28 October 2026** and found **0/6 published QL-246 signed proofs** at the inspected full SHAs. All six companion repositories have newer public source revisions since QL-250, including the AI Data Platform's newer commit during the QL-251 recheck. There are no authenticated gateway test receipts or approved live test windows. All four business integrations remain DISCONNECTED.

## Send back these six categories of evidence, clearly separating real observations from simulated claims

1. **Source and build identity:** exact repo, currently checked full `main` commit, original tested source SHA and a GREEN CI run with `head_sha` equal to that original source SHA.
2. **Later signed proof:** the distinct proof-bearing commit SHA, raw `docs/integration/ql246-source-proof.json` SHA-256, exact URL, 1-hour challenge validity, verified source ancestry and signature. The proof must be genuine and publishable; do not create a mock acceptance just to make the JSON appear.
3. **Independently authenticated key custody:** obtain the Ed25519 public SPKI fingerprint through a *separate authenticated channel*, retain a private chain-of-custody record and perform a fresh short-lived QL-250 nonce challenge. The apparent fingerprint within the proof cannot authenticate itself. Do not send a private signing key.
4. **Distinct witness return:** a separately identified and independently authenticated reviewer witnesses the custody response. A QL-251 signed offline witness statement may bind only the response digest, source/proof SHAs, business/tenant, challenge ID and observation time. Verify the witness key from an independently trusted source. A locally generated sample signature is **not** real-world evidence.
5. **Original gateway receipts:** isolate a nonproduction-only test runner, retain signed health/capabilities GET receipts, replay/stale/foreign business/foreign tenant/revoked key/write/dispatch denials, trace IDs, audit durability through restart and rotation rollback. If not conducted with owner permission, say **NOT TESTED**.
6. **Separate authenticated owner test decision:** request approval for *only* a named UTC window and the two explicit GET paths. An app-supplied signed request or an approval-like receipt ID must remain **PENDING AUTHENTICATION** until identity, timing, test-only credentials, tenant and reviewer are independently verified. A pilot release requires a second, later owner decision.

## Read-only window constraints

| Property | Maximum authorized proposal scope (still HELD) |
| --- | --- |
| Environment | `nonproduction` only |
| Method | `GET` only |
| Paths | `/api/integration/v1/health`, `/api/integration/v1/capabilities` |
| UTC duration | Up to 30 minutes, proposed no more than 14 days ahead |
| Company / tenant | Exact source company and, for Yard Workers/iCamp, a separately approved test tenant |
| Credentials | Test-only key IDs in public metadata; values held in private secret storage |
| Owner authorization | **NOT GIVEN** until separately authenticated and explicitly scoped |
| Automatic scheduling / live requests | **PROHIBITED** at this stage |

The latest Comms Hub code has an offline QL-251 witness and review-request verifier at `scripts/ql251-witness-return-test-authorization.mjs` and a safe public-only source rechecker at `scripts/ql251-recheck-six-app-public-proofs.mjs`. To test locally without accessing any network, run `npm run verify:ql251` or invoke the rechecker without arguments. With intentional permission for public GitHub metadata *only*, use `node scripts/ql251-recheck-six-app-public-proofs.mjs --public-get`.

Do not interpret GREEN application deployment, a GitHub commit, a self-signed proof, a matching offline signature or a proposed window as permission to run a real gateway test. **Keep the actual Comms Hub connection state DISCONNECTED.**

**Next expected Comms Hub build: QL-252 — Source-Proof Publication Escalation, Independent Custody Pin Provenance & Test-Only Owner Decision Evidence Intake (HELD).**
