# Rosevear QL-253 — six-app signed proof + private trust registry action sheet (HELD)

**Send this document to each of the SIX companion-app build conversations.** This is a specific action request, **not** permission to connect. The GitHub source proof, independent signer custody, and owner TEST-only permission are three different gates. A GREEN app deployment does not clear them.

**As of the public-only QL-253 check: 28 October 2026, 10:43 p.m. Eastern.** Comms Hub independently checked public GitHub `main` and the exact `docs/integration/ql246-source-proof.json` path at the following immutable SHAs. Every result was HTTP **404**. A subsequent build may change the result; check again and report the actual SHA and response.

| Source / repository | QL-253 observed `main` SHA | Original signed QL-246 proof |
| --- | --- | --- |
| AI Data Platform / `RosevearCreations/ai-data-platform` | `76f73363a9a29a34ed8bf09b6b4ff58a0dc77482` | 404 / HELD |
| Devil n Dove / `RosevearCreations/devilndove-site` | `962cd59efe8ebfeda623b6f82b95c030adfc3ab4` | 404 / HELD |
| Rosie Dazzlers / `RosevearCreations/rosiedazzlers` | `65c3654309426c0e654262e7a9d46a113d1ed6a4` | 404 / HELD |
| Yard Workers / `RosevearCreations/yw` | `25436da1c91a374f7ebd195508a33fdee259873e` | 404 / HELD |
| iCamp / `RosevearCreations/iCamp` | `4397a1d74a7a058b64cc9a991fd3ccfd42c02d39` | 404 / HELD |
| Rosevear AI Hub / `RosevearCreations/rosevear-ai-hub` | `f81dc739b8af0bcd6c8ffae00aa5ecc9b9dd197d` | 404 / HELD |

## 1. Actions required of every source app

1. **Name tested source commit A** (40 hex) and its real completed GREEN GitHub Actions run. Confirm run `head_sha` **equals A**; do not borrow a run for another SHA. If there is no matching source CI, report `NOT_AVAILABLE` and remain HELD.
2. **Use a genuine signer under documented private custody.** Create the canonical QL-248 `rosevear.integration.v1` nonproduction proof payload that names A, the exact repository, approved business/tenant, `GET` and only `/api/integration/v1/health` and `/api/integration/v1/capabilities`. Sign with a real Ed25519 signing key held outside git and build logs. Do not create example/signature fixtures and pass them off as original evidence. False original gateway denial, owner approval, or durable-audit claims are forbidden.
3. **Publish proof commit B** as a descendant of A with genuine signed envelope at `docs/integration/ql246-source-proof.json`. A and B must be **different** commits. The payload refers to **A**, never B. Promote B through your usual dev/main workflow; verify your normal application deployment independently.
4. **Retrieve immutable proof B publicly** at `https://raw.githubusercontent.com/RosevearCreations/<repository>/<full-B-sha>/docs/integration/ql246-source-proof.json`. Independently require HTTP 200 and compare *exact raw bytes* SHA-256, JSON schema, Ed25519 signature, source A, A→B ancestry, exact Actions CI `head_sha=A`, business/tenant, expiry and negative-test metadata. Commit signing or a self-signed public key alone does not establish signer custody.
5. **Arrange private key-pin custody verification** outside GitHub: independent custodian and different witness verify the signer’s actual public SPKI SHA-256 against a separately maintained trusted registry. Record the registry snapshot digest and opaque receipt IDs, then complete a short-lived five-minute nonce challenge bound to A, B, system, business and tenant. An app’s own claim that its pin is trusted is not independent verification. Do not place private registry content or contact information in public artifacts.
6. **Ask for TEST-only owner authorization separately**, using a trusted private process to authenticate the actual owner and record an auditable decision for one named nonproduction business/tenant, a future UTC window of at most 30 minutes, method `GET`, and the two paths above. It is currently `NOT_GIVEN`. A form, signed-looking document, GitHub issue, PR merge or chat message does not itself authenticate that decision. Do not schedule or run the GETs while HELD. Owner **pilot** consent is a later, distinct decision.

Return missing fields explicitly as `NOT_AVAILABLE`; preserve the HOLD. CI GREEN or a successful ordinary deployment can coexist with `DISCONNECTED / HOLD` integration status.

## 2. Paste this sanitized return into Comms Hub

```text
application_name:
repository: RosevearCreations/<exact_repo>
source_sha_A: <actual 40 hex or NOT_AVAILABLE>
source_ci_run_url: <matching head_sha A Actions URL or NOT_AVAILABLE>
proof_commit_sha_B: <actual descendant 40 hex or NOT_AVAILABLE>
immutable_public_proof_url: <full B immutable raw URL or HTTP 404>
exact_proof_bytes_sha256: <exact raw bytes digest or NOT_AVAILABLE>
public_spki_sha256: <public SPKI digest or NOT_AVAILABLE / UNTRUSTED>
out_of_band_registry_snapshot_sha256: <digest or NOT_AVAILABLE>
out_of_band_registry_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
out_of_band_custody_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
distinct_independent_witness_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
owner_test_decision: NOT_GIVEN | REQUESTED_PRIVATE_REVIEW
owner_test_receipt_id: NOT_AVAILABLE
real_health_and_capabilities_get_receipts: NOT_RUN
original_seven_negative_denial_receipts: NOT_VERIFIED
connection_state: DISCONNECTED
```

Never return credentials, signed private challenges, private keys, JWTs, tokens, raw identity documentation, private gateway URLs, home IP addresses, customer information, Etsy secrets, vault, camera or device data. Treat opaque receipt IDs as references, not proof of authentic private custody.

## 3. Nonproduction TEST and private 24/7 server sequence (no execution yet)

Once a source A/B proof is independently authenticated and its key pin is trusted, an authorized reviewer may ask the owner to approve **one** time-limited nonproduction `GET` trial. Only after a real authenticated decision may a separate test runner using per-app least-privilege, short-lived credentials contact the two permitted paths. Collect original durable gateway receipts and seven negative-denial test cases; preserve rollback and revocation. Any mismatch means HOLD. This is **not** permission to publish listings, send messages, take payments, manage campsites, manipulate devices or run live communications.

The **Rosevear AI Hub Windows PC** is a possible always-on *private* mini-server/relay for future controlled connectivity. The proposed architecture is: outbound-only authenticated connector to an approved Comms Hub service, or communication over existing owner-managed Tailscale/private routing, with per-app credentials and isolated tenants. No router port forwarding, public inbound listener, DNS exposure of home devices, vault access, camera access, remote shell access or reuse of AI Hub master secrets is part of this build. Do not deploy a daemon on the home PC yet; separately confirm host availability, trust, owner authorization, service account and rollback first.

## 4. Comms Hub QL-253 verification commands

```sh
npm run verify:ql253
npm run integration:ql253-public-proof
npm run integration:ql253-public-proof -- --public-get
```

The first command exercises *synthetic offline* fail-closed safeguards. The second performs **no network requests**. Only the opt-in third command queries allowlisted **public GitHub** endpoints, never an app gateway or home server. All results remain HELD without independently verified private evidence and authenticated owner TEST permission.

**Next proposed QL-254:** Six-App Original Signed Proof Retrieval Follow-Up, Independent Private Pin Registry Witness Evidence and Reversible 24/7 Relay Readiness (HELD).
