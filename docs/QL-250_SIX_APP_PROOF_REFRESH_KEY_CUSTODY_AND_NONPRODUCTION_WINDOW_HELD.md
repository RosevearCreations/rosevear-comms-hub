# QL-250 — Independent six-app source refresh, key-pin custody challenge & held nonproduction GET window

**28 October 2026 (Eastern) · Rosevear Comms Hub · no live gateway interaction.**

The user forwarded the QL-249 handoff to all six applications and reports active companion builds. The QL-250 independent read-only public GitHub API/raw-file refresh retrieved the six `main` revisions below. All six exact `docs/integration/ql246-source-proof.json` files returned **HTTP 404** at the listed *immutable* revisions. All six repositories have advanced since the preceding QL-249 snapshot, including AI Data Platform during the QL-250 recheck. These are dated observations, not assertions about future builds or app CI failure.

| App | Repository | Checked `main` SHA | Proof HTTP | Change since QL-249 |
| --- | --- | --- | --- | --- |
| AI Data Platform | `RosevearCreations/ai-data-platform` | `aad88d820faa86d7115d9c19b5fd0d3507da9dcd` | 404 | advanced during refresh |
| Devil n Dove | `RosevearCreations/devilndove-site` | `23f564a974dc6e0b0c52b1ca24616d2697857e4f` | 404 | advanced |
| Rosie Dazzlers | `RosevearCreations/rosiedazzlers` | `636159d033aa9764987d01eae7f1100c2c689c7a` | 404 | advanced |
| Yard Workers | `RosevearCreations/yw` | `3f4668416dcafa2612767a79ad4e06840112ac37` | 404 | advanced |
| iCamp | `RosevearCreations/iCamp` | `371abeec1e65c1809d059cafcb81136a0b6d369a` | 404 | advanced |
| Rosevear AI Hub | `RosevearCreations/rosevear-ai-hub` | `44c48f56c039ff539a98965eaa1d5a6b5c188ed4` | 404 | advanced |

Since no signed QL-246 proof was present, **no source/proof ancestry and matching *proof-claimed source* CI run could yet be independently verified**; public GitHub `main` HEAD alone is not proof of source CI, gateway success, an independently pinned signer, or permission to connect. QL-250 did not fetch, schedule or contact any application gateway. In this environment, direct Node `fetch` to public GitHub failed; the bounded independent public check used the reachable command-line GitHub HTTP client. Never label a failed network attempt as a successful attestation.

## New bounded offline controls

1. `scripts/ql250-pin-custody-window-witness.mjs` validates an Ed25519 *key-control response* to a 32-byte random nonce, with exact source/proof commit SHAs, repository, business, tenant, public SPKI SHA-256 fingerprint and five-minute maximum UTC challenge life. Reused challenge IDs supplied by an operator are rejected. **An apparent pin reference submitted in JSON is not independent authentication of its origin.** Offline key-control matching never releases the test or the pilot.
2. An optional **display-only** UTC window proposal must include exactly the six-app allowlisted identity, `nonproduction`, only `GET`, only `/api/integration/v1/health` and `/api/integration/v1/capabilities`, a future time within 14 days and a maximum 30-minute window. Receipt ID claims, even apparently owner-related ones, remain **unverified**. No timer or network GET is created.
3. `scripts/ql250-review-six-app-source.mjs` is zero-network by default. An operator may explicitly request **public GitHub only** with `--public-get`, which invokes an allowlisted, bounded, no-shell cURL transport with no .curlrc, tokens, redirects, real gateways, customer records or home endpoints. It reports status without a false claim of independent proof.
4. Both offline functions fail closed for schema drift, invalid signatures, stale or replayed challenges, wrong source scope, non-GET methods, foreign URLs, expired/far-future windows or extra fields. Tests use only local generated synthetic keys and do not interact with external apps.

## Hard release boundary

| Evidence or permission | At this observation |
| --- | --- |
| Public QL-246 source proofs at checked SHAs | 0/6 |
| Exact source-CI run verified from published signed proof | 0/6 |
| Separately authenticated out-of-band signer pins and custody witnesses | 0/6 |
| Original authenticated nonproduction health/capabilities gateway GET witnesses | 0/6 |
| Original seven denial outcomes, durable audit / rotation rollback receipts | Not independently verified |
| Independent authenticated OWNER TEST authorization | **NOT GIVEN** |
| Nonproduction GET windows scheduled | **0** |
| Independent authenticated OWNER PILOT authorization | **NOT GIVEN** |
| Actual business connections | **DISCONNECTED** |
| Real communications prerequisites / calls / SMS / dispatch / writes | **12/12 HELD; 0 / 0 / 0 / 0** |

The Comms Hub `main` application can be deployed GREEN while all real integrations remain explicitly DISCONNECTED. This release must not activate the Etsy channel, product writes, booking/gift/payment operations, jobs/payroll, campground access, cameras/vaults, provider phone/SMS or dispatch.

Share [the QL-250 custody challenge and nonproduction test-window handoff](ROSEVEAR_QL250_CUSTODY_CHALLENGE_AND_NONPRODUCTION_WINDOW_HANDOFF.md) with the other six applications only after their public proof work is ready. Never post secrets, private-key materials, actual owner identity details or household endpoints in GitHub or in a handoff.

**Next expected Comms Hub build: QL-251 — Six-App Signed Source-Proof Publication Recheck, Independent Custody Witness Returns & Explicit Nonproduction GET Trial Authorization Review (HELD).**
