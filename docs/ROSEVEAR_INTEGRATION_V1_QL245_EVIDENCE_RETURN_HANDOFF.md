# Rosevear Integration Contract v1 — QL-245 six-app evidence return and conditional connection-testing handoff

**October 27, 2026 (Eastern). Send this document to all six companion GitHub applications.**

The owner supplied `Rosevear-Connect-V1.rtf`, containing an implementation update from **all six applications**. This is a valuable code-readiness update, **not** proof that any nonproduction gateway connection was successfully made. Comms Hub has received **six handoff summaries, zero independently verified live connections**. Do not label source code, a successful production deployment or a test fixture as an actual HMAC exchange.

**We are requesting independently verifiable, nonproduction, server-only, read-only evidence — not owner approval or live pilot activation.** All four company integrations stay `DISCONNECTED`. All 12 QL-181 communications gates stay `HELD_UNVERIFIED`. No marketplace, booking, payroll, guest, camera/vault, payment, message, command or device write.

## 1. Reconciliation of the actual six updates

| Application | Received implementation statement | Unresolved original proof |
| --- | --- | --- |
| AI Data Platform (`ai-data-platform`) | Contract code shipped; gateway remains inert, **no** nonproduction Devil n Dove registration pre-created | Real separately authorized gateway registry, scoped key ID, nonproduction origin, signed gateway GET/audit records and independent after-restart proof |
| Devil n Dove (`devilndove`) | Build 510: QL-243 12-line HMAC contract, source health/capabilities; product/listing reads **disabled**, key **not provisioned**, no live source receipt provided | Actual Build 510 commit/green CI, isolated nonproduction deployment, source key ID and authenticated source GET trace; gateway audit/owner/witness still absent |
| Rosie Dazzlers (`rosiedazzlers`) | Read-only authenticated health/capabilities, HMAC, tenant/replay checks, DB audit reported; `DISCONNECTED` | Unique provisioned test key ID, actual signed receipts, source SHA/CI, independently reviewed negative tests |
| Yard Workers / PMS (`yw`) | QL-243 checks reviewed/incorporated; still `DISCONNECTED` | Actual company tenant/active module identity, exact nonproduction endpoints, source SHA/CI, negative-test traces and signed receipts |
| iCamp (`icamp`) | Campground credentials, tenant isolation, replay protection, denial audit, read-only health/capabilities; `HOLD` | Actual campground ID, key exchange, source SHA/CI, signed receipts and independently witnessed cross-campground rejection |
| Rosevear AI Hub (`rosevear-ai-hub`) | Build 171: private off-by-default HMAC service-health scaffolding and SQLite replay audit; no production connector | Nonproduction private test runner, independently provisioned key, source SHA/CI and authenticated test receipts; do not expose any household topology, cameras, vault or automation |

**Important scope correction:** Devil n Dove currently advertises health/capabilities only; its product/listing reference reads remain disabled. The old QL-243 *future candidate* read scopes `read_product_reference` / `read_listing_reference` are **not yet callable**. QL-245 source checks permit only the two GET endpoints for health and capabilities. Any reference-data pilot requires a new separately approved capability.

## 2. Rules every application must implement before returning evidence

1. Test **nonproduction only**, with a private server-side key issued through a secure secret manager after separate approval to run nonproduction GETs. Never send HMAC secrets, private signing keys, bearer tokens, OTPs, identity documents or customer data to Comms Hub/GitHub/chat. Use a unique `np-...` key ID, distinct credential and app-signing key per source, scope, business, tenant and environment.
2. Use the exact QL-243 canonical 12-line HMAC authentication and `GET /api/integration/v1/health` plus `GET /api/integration/v1/capabilities`. AI Data Platform also exposes its own `GET /api/integration/v1/audit/receipts/{id}`. Enforce signed timestamp/nonce, atomic replay denial, exact business/tenant/method/path, revoked-key rejection, fail-closed audit and TLS; never bypass authentication just to make a test pass.
3. Test and record *seven* independent denial outcomes: nonce replay, stale request, wrong business, wrong tenant, revoked key, prohibited write, prohibited dispatch. Include original request trace/HTTP status and a signed, nonsecret audit receipt ID for each. Do not mark a negative test `true` if it was not actually executed.
4. Independently verify each app's exact 40-character GitHub source SHA and **green CI Actions run URL**. Inspect the deployed nonproduction code revision; production GREEN is not evidence of a nonproduction connection.
5. AI Data Platform must independently retrieve signed gateway health/capability/audit records and document read-after-restart durability, with a separate reviewer and proof of source origin. Nonsecret metadata is sufficient for the public handoff; do not share real customer payloads.
6. The independently pinned public-key trust file must come from separately authenticated channels, not from the signed packet itself. The QL-245 offline verifier requires **six distinct Ed25519 source public SPKI SHA-256 pins** and a seventh separate assessor pin.
7. An external reviewer must independently observe the original nonproduction service evidence, six distinct registry credentials, all seven negative denials and a credential revocation/rollback demonstration. A signed **claim** without independently observed originals is still **UNVERIFIED**.
8. No signed review report or conditional owner request is actual pilot approval. The owner must authenticate through a separate trusted channel and explicitly approve an exact app/tenant/operation/duration **after** all proof is reviewed, with working kill switch. None is authorized by QL-245.

## 3. Exact signed public response contract for the offline verifier

Each app produces an Ed25519-signed **public metadata only** payload in the exact field order defined in `scripts/ql245-six-app-evidence-review.mjs` as `QL245_SOURCE_KEYS`. The payload has **exactly**:

```text
schema_version, source_system, signer_key_id, business_id, tenant_id,
environment, source_revision, ci_run_url, key_id, registry_receipt_id,
health_receipt_id, capabilities_receipt_id, gateway_audit_id,
allowed_paths, scope, negative_tests, source_receipt_id,
audit_storage_review, owner_authorization, connection_state,
issued_at, expires_at
```

- `schema_version = rosevear.integration.v1`, `environment = nonproduction`; all receipt IDs and key IDs are **nonsecret** `np-...` identifiers.
- `allowed_paths` is the ordered two-item list `/api/integration/v1/health`, `/api/integration/v1/capabilities`; `scope` is ordered `read_health`, `read_capabilities`. Do **not** claim product/listing/customer read access yet.
- For `ai-data-platform`, `business_id = devilndove` (the initial candidate), `tenant_id = null`; `devilndove` also uses this combination. Rosie Dazzlers and Rosevear AI Hub use their own business IDs with null tenant. Yard Workers and iCamp use **real issued, separately trusted** nonproduction company/campground tenant IDs, not shared defaults.
- All seven `QL245_NEGATIVES` fields must match **actually observed** denials, with public references to the original test audit.
- `audit_storage_review = INDEPENDENT_RESTART_PROOF_PENDING`, `owner_authorization = NOT_GIVEN`, `connection_state = DISCONNECTED`; never claim these have passed merely by producing a signature.
- `issued_at` / `expires_at` use Unix milliseconds, ±5-minute clock freshness and ≤1-hour validity; only real source SHA and genuine GitHub Actions run URL are accepted.

The distinct assessor signs an envelope with `QL245_ASSESSOR_KEYS` — exact QL-244 assessor receipt/source revision, SHA-256 digest of all six canonical source payloads, `np-...` review receipt, `devilndove`/null/nonproduction scope, and `real_world_witness_confirmed=false`, `owner_pilot_authorized=false`, `rollback_verified=false`. Assessor signature matching is not owner authorization or real-world proof.

## 4. Local offline verification — no live connections

Prepare two **untracked** JSON files, neither containing secrets:

- Public packet: object with exactly `ql244Summary` (the prior held QL-244 CLI result), `returns` (six ordered entries with `system`, `publicKeyPem`, `envelope: { payload, signature }`), `assessor: { publicKeyPem, envelope }`.
- Trusted pin registry: object with exactly `sources` (six ordered entries `system`, `publicKeyFingerprintSha256`, `businessId`, `tenantId`) and `assessor` (a separately verified public SPKI SHA-256 fingerprint). This file comes from a **separate trust channel**. It is not an authority to connect; the verifier cannot independently confirm its origin.

```sh
node scripts/ql245-verify-six-app-evidence.mjs \
  --packet ./local-ql245-public-returns.json \
  --independently-sourced-pins ./separately-verified-public-pins.json
```

A positive result `SEVEN_PUBLIC_SIGNATURES_MATCHED_REAL_PROOF_PENDING_HELD` only means the seven signatures match the supplied public pins and QL-244 summary references; it **does not** prove that genuine live tests occurred, a secret changed hands, audited storage is durable or the actual owner authorized anything. No external requests are made. Paste **only** the sanitized result into the Comms Hub **Six-app evidence & activation HOLD** workspace after QL-244 has been independently verified.

## 5. Required truthful reply from each application

```text
Application name / source_system / exact repo / commit SHA / green CI Actions URL:
Exact nonproduction server origin and verified deployed revision (no private IP/hostname in public handoff):
Business ID / issued tenant ID / enabled module and read-only scopes:
Nonsecret public signing key ID and independently verified SPKI SHA-256 pin:
Nonsecret HMAC key ID, rotation/revoke status and registry receipt ID (NO SECRET):
Actual source health + capability signed receipts and independently retrieved originals:
Gateway-signed health/capabilities/audit IDs and independently retrieved audit datastore proof:
Seven real negative-denial test results, original audit trace IDs and independent reviewer:
Assessor signed six-app digest/receipt ID, independent witness channel:
Distinct owner identity challenge/approval receipt: NOT GIVEN until genuinely authorized
Reversible kill switch/rollback witness: NOT VERIFIED until independently tested
Remaining gaps:
Actual connection: DISCONNECTED / HOLD
```

If not implemented, write **NOT IMPLEMENTED**. If code exists but is off or no key is issued, write **NOT PROVISIONED**. If original live proof is missing, write **UNVERIFIED**. **Never fabricate a green receipt or substitute a fixture for a real nonproduction endpoint.**

## 6. Read-only pilot decision gates

| Gate | Current condition | Required next |
| --- | --- | --- |
| Six app code changes | Reported by owner summaries | Independently inspect exact commits, CI and deployed nonprod revisions |
| Six credentials and signed GET receipts | Not provided | Secret manager registration plus authenticated, witnessed nonprod tests |
| Independent public signer trust | Not provided | Seven separately obtained, distinct public-key pins |
| Durable gateway audit and negative denials | Claims only | Original stored audit traces, restart checks, revoked/replay/tenant negative tests |
| Owner identity and explicit pilot authorization | **NOT GIVEN** | Separate authenticated, scope/duration-specific owner approval |
| Four company connector states | **DISCONNECTED** | Remain held until all prerequisites and explicit later release |
| Twelve real communications prerequisites | **12/12 HELD** | Separate independent verification; no phone/SMS enabled |

**Expected next Comms Hub build: QL-246 — Independently Retrieved Six-App Source Proof, Trusted Pin Challenge & Owner-Safe Nonproduction Test Decision Reconciliation.** Do not promote actual connection activation by default.
