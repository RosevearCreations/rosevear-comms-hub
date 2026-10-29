# QL-251 — six-app signed source-proof publication recheck, witness return and owner test review (HELD)

**28 October 2026 (Eastern) · Rosevear Comms Hub · source-only public GitHub retrieval plus offline cryptographic fixtures.**

The latest public GitHub recheck retrieved each source's full `main` revision and attempted the exact immutable `docs/integration/ql246-source-proof.json` file at that revision. The public file remains **HTTP 404 for all six**. All six source repositories advanced since the QL-250 snapshot, including AI Data Platform during the QL-251 refresh. The result is a point-in-time evidence gap, not a judgment that the new companion application builds failed.

| Application | Source repo | Observed exact `main` SHA | Signed QL-246 public proof |
| --- | --- | --- | --- |
| AI Data Platform | `ai-data-platform` | `262a2e10cb04660d817b447acd8e91eab780e630` | 404 — HOLD |
| Devil n Dove | `devilndove-site` | `97b5cf18df25bdfa83e6514d8ce659b24ac2f6f8` | 404 — HOLD |
| Rosie Dazzlers | `rosiedazzlers` | `6240e05ff1121fe1df293d5a451f8bea62ae639c` | 404 — HOLD |
| Yard Workers | `yw` | `aa18edd039f93f021b264e58a34a6139d1d1cb2e` | 404 — HOLD |
| iCamp | `iCamp` | `95307163b14a52ab19d51a89829b0e41497397c7` | 404 — HOLD |
| Rosevear AI Hub | `rosevear-ai-hub` | `1e82f857f393cb8c6b09264a5e938f8ca2053dd0` | 404 — HOLD |

No source/proof ancestry or exact signed-proof-claimed CI run could be established because none of the six checked proof files exists at its immutable SHA. No real app gateway was contacted, and no owner's approval was assumed.

## New QL-251 offline verification

- `scripts/ql251-witness-return-test-authorization.mjs` accepts a strictly scoped, signed **offline witness return** only when the underlying QL-250 key-custody challenge cryptographically verifies. The witness's signed statement binds the custody response digest, source/proof SHAs, company/tenant, nonce challenge and observed time. The custody signer and witness signer must differ. A valid signature is still **a witness claim, not independently authenticated real-world witness identity**.
- The test-authorization review accepts only a signed **request for independent owner TEST review**, not a self-granting approval. It must match a future, up-to-30-minute UTC window limited to `nonproduction` GET `/api/integration/v1/health` and `/api/integration/v1/capabilities`, with no external URL, key value or write operation. Cryptographic match does **not** establish actual owner identity, consent, test authorization or pilot release.
- A linked packet checker ensures both signed claims identify the same exact app, source SHA, later proof SHA, tenant and witness receipt. All outputs remain **NOT GIVEN / DISCONNECTED / HELD** even when synthetic signatures match.
- `scripts/ql251-recheck-six-app-public-proofs.mjs` is no-network by default; `--public-get` explicitly enables only the strict public GitHub allowlist. It never makes gateway GETs, accepts credentials or changes runtime configuration.
- Tests cover all six synthetic applications, forged signatures, replay/stale custody challenges, swapped tenants and source SHAs, witness/pin self-reuse, forged owner consent, unauthorized methods and prohibited private URLs. No real identities, tokens or customer data are involved.

## Actual release preconditions — none silently fulfilled

| Independent requirement | Current independently observed status |
| --- | --- |
| Published signed QL-246 proof and exact source-CI ancestry | 0/6 at checked SHAs |
| Trustworthy out-of-band signer key pins and witnessed custody, not self-claims | 0/6 |
| Original signed nonproduction GET receipts and seven actual denial outcomes | 0/6 witnessed |
| Durable gateway audit after restart, revocation/rollback and tenant isolation | PENDING / not independently confirmed |
| Authenticated OWNER consent to run a named, narrow nonproduction GET window | **NOT GIVEN** |
| Scheduled GET windows or live app connections | **0 / DISCONNECTED** |
| Separately authenticated OWNER permission for a future read-only pilot | **NOT GIVEN** |
| Real communications prerequisites / writes / calls / SMS / dispatch | **12/12 HELD / 0 / 0 / 0 / 0** |

No live Etsy/Marketplace writes, bookings, gift issuance or delivery, payments, payroll, campground gates, home devices, vault access, telephone/SMS or provider dispatch are permitted. Sharing the same GitHub organization or having GREEN deployment checks does not authenticate service connections.

Forward [the QL-251 public companion return handoff](ROSEVEAR_QL251_SOURCE_WITNESS_TEST_AUTHORIZATION_HANDOFF.md) to each app. Private custody material, real owner decisions, tokens, internal endpoints and customer information must never be included in this public document.

**Next expected Comms Hub build: QL-252 — Source-Proof Publication Escalation, Independent Custody Pin Provenance & Test-Only Owner Decision Evidence Intake (HELD).**
