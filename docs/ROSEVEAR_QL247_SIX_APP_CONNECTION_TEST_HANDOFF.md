# Rosevear Interconnectivity QL-247 — six-application connection-test readiness handoff

**Forward this to the six companion GitHub applications. Do not include credentials.**

Each app is in the `RosevearCreations` GitHub account, but **GitHub identity is not service-to-service authentication**. We can independently retrieve public source proof; a live API test requires app-specific nonproduction endpoint access, separately provisioned scoped credentials, pinned signing keys and an independent reviewer. All four operating businesses remain `DISCONNECTED / HOLD` and Comms Hub phone/SMS/live dispatch remains disabled.

## Required next return, one per app

| Application | Correct GitHub repo | Immediate missing item |
| --- | --- | --- |
| AI Data Platform | `RosevearCreations/ai-data-platform` | Publish the QL-246 source proof and a separate owner-safe return. Its gateway must stay nonproduction-only. |
| Devil n Dove | `RosevearCreations/devilndove-site` | Publish independently signed source proof; confirm product/listing data reads and marketplace writes remain disabled. |
| Rosie Dazzlers | `RosevearCreations/rosiedazzlers` | Publish source proof; record real gateway read-only test and seven independently observed denials if and when safely performed. |
| Yard Workers | `RosevearCreations/yw` | Verify Build 477 is actually production promoted; publish proof with a genuine isolated company tenant ID. |
| iCamp | `RosevearCreations/iCamp` | Publish proof with an independently confirmed campground tenant ID; no gate or reservation commands. |
| Rosevear AI Hub | `RosevearCreations/rosevear-ai-hub` | Preserve LAN/private-only operation; establish an approved **private test runner** before considering key issuance or signed proofs. Do not publish IPs, hostnames, device or vault information. |

## Phase A — public source and trust preparation (safe to prepare now)

1. Each app independently takes the exact current **40-character `main` commit SHA** and its corresponding GitHub Actions CI run; do not reuse an earlier run from another commit.
2. Following the AI Data Platform `docs/ROSEVEAR_QL246_SIX_APP_SOURCE_PROOF_HANDOFF.md`, prepare an Ed25519 source signer and obtain its public SPKI SHA-256 fingerprint **through a separately authenticated channel**. Keep the Ed25519 private key in the app’s own secret manager. Inspect its read-only source code, CI and tenant mapping; do not claim the final QL-246 proof yet.
3. Return: repository, immutable SHA, CI URL, signer-key readiness and fingerprint verified out of band, business/tenant mapping, which original audit/health/capabilities IDs genuinely exist, and remaining PENDING items. No source credentials are exchanged in this public phase.
4. The **final** signed envelope at `docs/integration/ql246-source-proof.json` requires seven *actually observed* denial tests, which depend on Phase B's separately authorized nonproduction tests. It is therefore correct for this file to remain **MISSING / BLOCKED during Phase A**. Do not create a fake proof or mark the denials true just to satisfy a file-presence check.

## Phase B — controlled nonproduction authenticated GETs (separate authorization and secrets)

1. Owners approve an exact **nonproduction test only**: destination, tenant, source, GET paths, expiry, reviewer and rollback. Approval to run this test **is not approval for a live pilot**.
2. Provision **distinct 256-bit random HMAC secrets** per source/tenant/environment in each server’s approved secret store, never in GitHub, chat, client JavaScript, public proof or a shared environment across all companies. Exchange only key IDs and public Ed25519 verification fingerprints through the operator handoff.
3. Server-to-server over authenticated HTTPS or explicitly protected private transport, invoke only `GET /api/integration/v1/health` and `/api/integration/v1/capabilities` with the exact QL-243 twelve-line canonical HMAC, ±5-minute timestamp window and atomic nonce replay suppression.
4. Have an **independent reviewer** observe genuine replay, stale timestamp, wrong business, wrong tenant, revoked key, prohibited write and dispatch denials at the target system. Preserve signed nonsecret receipt IDs and original trace references, not raw customer or household data.
5. Independently fetch the actual gateway receipt/audit from the source of truth after restart/redeploy, verify separately pinned public signing keys and the deployed source SHA, then test scoped key rotation/revocation and kill-switch rollback. Do not treat code fixture tests as original evidence.
6. **Only now**, with genuine original observations, request a fresh one-hour QL-246 owner challenge, sign the final source proof with actual seven-denial results, commit it, report its exact new SHA and verify it independently. If the challenge expires during CI or across the six apps, re-issue it and repeat safely; never backdate signed proof.

## Phase C — owner-safe pilot decision (NOT AUTHORIZED)

Only after Phase A and B, including the **post-test final QL-246 source proof**, are independently proven may an authenticated owner consider **a new, specific, time-bounded, reversible read-only pilot authorization**, per business and tenant. The present handoff does not grant that decision. Product/booking/payment/marketplace, campsite/gate, payroll/job, device/vault and phone/SMS writes are not part of this scope.

## Copyable truthful reply

```text
Application / GitHub repo / exact current main SHA / green CI URL:
QL-246 public signed proof URL at that immutable SHA: PRESENT / MISSING / BLOCKED
Public JSON SHA-256 / signer ID / separate authenticated Ed25519 SPKI pin:
Business ID / issued tenant ID / authorized nonproduction origin (private details sent only through approved secret channel):
Scope: GET /health and GET /capabilities only
HMAC key ID and registry/rotation receipt (no key value): PROVISIONED / NOT PROVISIONED
Real authenticated GET health/capabilities receipts: VERIFIED / UNVERIFIED
Seven real denial cases with original trace IDs and independent witness: VERIFIED / UNVERIFIED
Real durable audit after restart and independently pinned gateway signer: VERIFIED / UNVERIFIED
Private runner / rollback / revocation witness: VERIFIED / UNVERIFIED
Separate owner pilot approval: NOT GIVEN
Actual connection: DISCONNECTED / HOLD
Remaining exact blockers:
```

Never paste tokens, private signing keys, HMAC keys, bearer credentials, customer records, personal health or household network topology into the return. Reply **NOT IMPLEMENTED**, **NOT PROVISIONED**, or **UNVERIFIED** when appropriate. Comms Hub QL-247 can verify public GitHub provenance, but **cannot make seven authenticated applications trust one another merely because they share a repository owner**.
