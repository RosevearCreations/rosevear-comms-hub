# ROSEVEAR QL-250 — six-app source proof, independent key custody and safe test window return

**Give this same public handoff to AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp and Rosevear AI Hub.**

QL-250 rechecked each app's public GitHub `main` on **28 October 2026**. All six checked immutable revisions had **404** for `docs/integration/ql246-source-proof.json`. The companion apps may have progressed later; return **new full 40-character commit IDs** for another check. An app being GREEN in GitHub CI is not authorization to connect.

## Per-app response requested

1. Public repo and current exact `main` SHA, verified by the app team.
2. Earlier **tested source SHA** and a GitHub Actions run proving that exact `head_sha` is successful.
3. Later **proof-bearing commit SHA** and raw public `docs/integration/ql246-source-proof.json` URL; its Ed25519 signature is on the earlier source revision. Return SHA-256 of the raw file. If not genuinely published, say **PENDING**.
4. Independent out-of-band key-custodian / reviewer role, provenance receipt reference, Ed25519 public SPKI SHA-256 fingerprint and any applicable revocation/rotation evidence. **Do not copy the fingerprint solely from the same public proof and call it independently pinned.**
5. The real health/capabilities GET receipts, seven genuine denial results, correlation IDs, durable audit after restart, revoked-key rollback outcome, separate company/tenant boundary and the human witness role. If not yet done, report **NOT TESTED**.
6. An **optional, unexecuted proposal** for a future UTC nonproduction-only test window; no GET may occur until the owner has separately authenticated and approved the exact test and an independent reviewer has verified all prerequisites. A window proposal or owner-like receipt *claim* is not owner consent.

## Key custody verification (private operator workflow)

The public source proof's self-signature only proves a key signed it. An independently authenticated operator must obtain the correct public SPKI SHA-256 **through a distinct trusted channel**, then issue a fresh cryptographically random 32-byte nonce bound to the app's source SHA, later proof SHA, key fingerprint, business and tenant; the app's key custodian signs the canonical QL-250 challenge bytes. Independently witness the custodian and retain a private, access-controlled replay ledger. The offline verifier is in `scripts/ql250-pin-custody-window-witness.mjs` and its tests show exactly how to construct/verify the canonical signed message. It performs **zero network requests**.

This is **not** a request to email private keys, HMAC credentials, signed real owner identity documents or live environment URLs. Keep those in the existing secrets manager and authenticated custody workflow, not GitHub/ChatGPT.

## Test-window review (no scheduling)

The only permitted future proposed operation is **GET** to `/api/integration/v1/health` and `/api/integration/v1/capabilities`, in `nonproduction`, explicitly scoped to the approved app/business and (for Yard Workers and iCamp) its exact test tenant. A candidate must use a future UTC start (within 14 days), end no more than 30 minutes later, test-only key ID (not its value) and no more fields. Even a supplied owner approval receipt ID will be classified **UNVERIFIED / HOLD** until a separate authenticated owner test decision is checked. The offline helper makes **no schedule** and calls **no gateway**.

Keep test-owner authorization and eventual reversible **pilot-owner authorization** as separate signed decisions. No implicit permission arises from shared GitHub ownership, an app build, a green deployment, a self-signed file, or a previous hold review.

| App | Additional safe handling |
| --- | --- |
| AI Data Platform | Read-only consumer with separately pinned source/proof commits; no shared database credentials |
| Devil n Dove | No Etsy/Marketplace listing, stock, photography or catalog write |
| Rosie Dazzlers | No bookings, payments, gifts, actual customer messages or SMS |
| Yard Workers | Exact owner-approved company test tenant; no employee, payroll, work-order or dispatch write |
| iCamp | Exact owner-approved campground tenant; no booking, gate or visitor control |
| Rosevear AI Hub | Private isolated local runner only; never publish home IP, cameras, household IoT or vault details |

**Status at QL-250:** six proof files missing; independent key custody witnesses 0/6; owner test authorization NOT GIVEN; owner pilot authorization NOT GIVEN; real GET windows NOT SCHEDULED; all connections DISCONNECTED. No live communications or writes.

**Next Comms Hub build: QL-251 — Six-App Signed Source-Proof Publication Recheck, Independent Custody Witness Returns & Explicit Nonproduction GET Trial Authorization Review (HELD).**
