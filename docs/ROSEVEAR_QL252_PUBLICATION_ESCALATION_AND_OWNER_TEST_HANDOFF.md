# Rosevear QL-252 — SIX APP SOURCE-PROOF PUBLICATION BLOCKER ACTION SHEET

**Forward this document to ALL SIX source app build conversations.** No credentials, signing private keys, raw owner identity documents, hidden gateway URLs, home-network addresses, private customer records or token values in GitHub or this handoff.

## Why all six show HELD

Comms Hub independently queried each app's public `main` at the latest QL-252 snapshot (**28 October 2026, Eastern**) and tried the immutable QL-246 signed proof path `docs/integration/ql246-source-proof.json` at that exact SHA. **All six returned 404**. Source `main` advances, normal CI and a successful deployment **do not publish that specific integration proof automatically**. Therefore each application must **explicitly build and publish** it; do not relabel the app GREEN as “connected.”

| App / GitHub repo | Observed `main` commit | What to fix |
| --- | --- | --- |
| AI Data Platform / `RosevearCreations/ai-data-platform` | `037b18247e59cb68d1f7ca5d7149595bd7487957` | Publish genuine QL-246 signed source proof and its exact source CI |
| Devil n Dove / `RosevearCreations/devilndove-site` | `340d6da39abed229094527dfc91a7fd423fabd02` | Publish proof; keep actual Etsy publishing and product writes disabled |
| Rosie Dazzlers / `RosevearCreations/rosiedazzlers` | `901b01e9c01cbbeac190ae9793b0b5aa29a7c4dd` | Publish proof; no gift delivery/resend/charge or booking write |
| Yard Workers / `RosevearCreations/yw` | `a4fceebafea8f09fb1f0e71eb1ad99a7a77e3168` | Publish proof with explicitly approved **nonproduction tenant** only |
| iCamp / `RosevearCreations/iCamp` | `5f7caaef37a2f8ec8ba2eb2913564e1a3b3c62c9` | Publish proof with approved nonproduction campground tenant; no gates |
| Rosevear AI Hub / `RosevearCreations/rosevear-ai-hub` | `4faac87c3ae2e4857066d9b819663d49f133b939` | Publish public proof only; no public home/vault/device gateway |

## Minimal concrete implementation for EVERY app

1. **Source commit A:** take a tested source commit SHA (`A`). Capture a GREEN CI run URL whose `head_sha` is **exactly A**. Preserve its full 40-character SHA.
2. **Authentic Ed25519 proof:** generate a short-lived nonproduction challenge (max 1 hour), sign the QL-248 canonical `rosevear.integration.v1` payload referencing **A** with a securely held signing key. Include the *public* key, signature and the exact required negative-test **metadata**. If actual negative tests were not performed, distinguish claimed test configuration from independently witnessed test results; do **not** fabricate gateway audit receipts.
3. **Proof commit B:** commit the genuine signed JSON to **exactly** `docs/integration/ql246-source-proof.json`, descendant of A; then promote **B** to `dev` and `main`, preserving the original CI proof for A. The signed JSON must refer to A, **never B**, because B did not exist when its contents were signed.
4. **Verify from public GitHub at immutable B:** `https://raw.githubusercontent.com/RosevearCreations/<repo>/<full-B-sha>/docs/integration/ql246-source-proof.json` must return 200. Supply the SHA-256 of its exact raw bytes, distinct A and B full SHAs, source CI run URL, and a public commit/compare URL that proves A is an ancestor of B. Do not include private key material.
5. **Independent signer trust:** identify an independently authenticated custodian and reviewer, each holding **separate** public fingerprints and distinct private attestations obtained outside GitHub. Use a fresh 5-minute QL-250 nonce challenge and distinct QL-251 witness signature bound to exact A/B, business/tenant and response hash. The QL-252 provenance packet has a claimed channel + receipt ID; it is only a *candidate* until a human verifies origin.
6. **Owner TEST-only decision:** request a **separate authenticated owner decision**, naming only the nonproduction test business/tenant, future 30-minute-or-shorter UTC window, `GET` and the two `/api/integration/v1/health` and `/api/integration/v1/capabilities` paths. A separately signed QL-252 **approval claim is not sufficient**; it stays `HELD` until actual owner identity and scope are authenticated in a private trusted process. Do not schedule or execute any real gateway requests before this approval.

At the time of QL-252, actual test approval is **NOT GIVEN**, and all integrations stay `DISCONNECTED`. Do not expose an unauthenticated endpoint just to satisfy a GET test. After a separate real approved test, original authenticated GET receipts, seven denial cases, tenant isolation, audit durability, revocation/rollback and a later separate owner pilot release must still be verified.

## Return only these public, non-secret fields

```
application_name:
repository: RosevearCreations/<exact_repo>
source_sha_A: <40-character full SHA>
source_ci_run_url: https://github.com/RosevearCreations/<exact_repo>/actions/runs/<run-id>
proof_commit_sha_B: <40-character full SHA, descendant of A>
immutable_public_proof_url: https://raw.githubusercontent.com/RosevearCreations/<exact_repo>/<B>/docs/integration/ql246-source-proof.json
exact_proof_bytes_sha256: <64 lowercase hex>
public_spki_sha256: <64 lowercase hex; UNTRUSTED UNTIL OUT-OF-BAND VERIFIED>
out_of_band_custody_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
distinct_witness_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
owner_test_decision: NOT_GIVEN | REQUESTED_PRIVATE_REVIEW | INDEPENDENTLY_VERIFIED_BY_OWNER
owner_test_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
actual_gateway_test: NOT_RUN
connection_state: DISCONNECTED
```

Return the **actual** `404` or `NOT_AVAILABLE` if your proof or private attestation has not been published/verified. Never substitute a sample, fictitious signature, mocked gateway call or CI success for original source evidence.

For Comms Hub verification: `npm run verify:ql252` exercises fully synthetic offline security fixtures; `npm run integration:ql252-public-proof -- --public-get` explicitly fetches public GitHub metadata only. Neither command connects any application or changes production settings.

**Next QL-253 (queued):** independently retry each newly published proof at immutable B, compare source-CI/proof ancestry, renew real custody pin challenge exceptions and reconcile a separately verified owner TEST-only decision; keep rollout HELD until actual authorization.
