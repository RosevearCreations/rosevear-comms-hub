# QL-252 — Six-app publication escalation, custody pin provenance and owner TEST-only evidence (HELD)

**Source check: 28 October 2026, Eastern · public GitHub GETs only.**

The owner reports all six companion apps remain `HELD` for interconnection. A fresh independently executed public GitHub recheck again found the exact public proof file `docs/integration/ql246-source-proof.json` missing (HTTP **404**) at **each** checked `main` commit. Each repo advanced beyond its QL-251 observation. This does **not** show that any app's normal build or production deployment is broken: release readiness and signed *interoperability evidence* are separate checks.

| App | Exact observed main revision | Public QL-246 signed source proof | Escalation |
| --- | --- | --- | --- |
| AI Data Platform | `037b18247e59cb68d1f7ca5d7149595bd7487957` | 404 | Publish two-commit original signed proof |
| Devil n Dove | `340d6da39abed229094527dfc91a7fd423fabd02` | 404 | Publish two-commit original signed proof |
| Rosie Dazzlers | `901b01e9c01cbbeac190ae9793b0b5aa29a7c4dd` | 404 | Publish two-commit original signed proof |
| Yard Workers (`yw`) | `a4fceebafea8f09fb1f0e71eb1ad99a7a77e3168` | 404 | Publish source proof with approved test tenant |
| iCamp | `5f7caaef37a2f8ec8ba2eb2913564e1a3b3c62c9` | 404 | Publish source proof with approved test tenant |
| Rosevear AI Hub | `4faac87c3ae2e4857066d9b819663d49f133b939` | 404 | Publish source proof; keep home endpoints private/off |

These SHAs are point-in-time observations; source teams continue to build. Do not use this table as an immutable current-state assertion later. A 404 at `main` is a separate finding from any previously published artifact at a distinct SHA.

## What QL-252 adds

1. **Publication blocker queue:** `node scripts/ql252-publication-escalation.mjs` runs with *zero network*. Add `--public-get` to retrieve only six known public GitHub source/proof/CI records. It emits a separate exact proof-publication action for each missing proof; a failed fetch is not falsely reported as 404.
2. **Offline custody-origin reconciliation:** `inspectQl252CustodyProvenance` confirms a strict non-secret out-of-band pin *record claim* matches a valid QL-251 witnessed QL-250 custody challenge, exact repo, two SHAs, business, tenant, SPKI key fingerprints, claim channel and time. Its positive status still means **independent custody and real-world verifier identity unconfirmed**.
3. **Offline signed owner decision intake:** `inspectQl252OwnerTestDecision` links a separately signed TEST-only `APPROVE_TEST_ONLY_REVIEW_CLAIM` or `DECLINE_TEST_ONLY_REVIEW_CLAIM` with its exact QL-251 signed test request, witness and custody metadata. An owner signing key must differ from custody/witness/request keys. A matching signature does **not** authenticate the owner; no real owner consent is inferred.
4. **Disabled operator preview:** Six explicitly listed proof blockers, independent-pin evidence guidance and owner test/pilot decision separation. No approval button, server credential, scheduler, gateway probe or live connector added.

## Exact actions before a connection can be tested

**For each companion app, in this order:**

1. Publish the authentic signed proof in the *exact* location on `main` using the **two-SHA** method in [QL-252 companion handoff](ROSEVEAR_QL252_PUBLICATION_ESCALATION_AND_OWNER_TEST_HANDOFF.md). Source SHA must be a tested commit. Later proof-bearing SHA must contain the signed JSON, whose payload points back to source SHA. Include exact green CI run for the source SHA; verify independent ancestry.
2. Establish a trustworthy, separately authenticated **public-key fingerprint** for the signer *outside the same GitHub repository*, plus private custody trail and distinct independent reviewer. Do not treat the repo's own self-signed key as trust.
3. Collect fresh challenge / separately witnessed response, immutable source proof, original test environment URLs **through private channels only**, the seven denial outcomes and durable audit checks. Original authentic gateway receipts still require an **explicit, independently authenticated OWNER authorization to conduct a named narrow nonproduction GET test**. At the time of this report, that authorization is **NOT GIVEN**.
4. Only after proof, trusted identity and separately scoped owner test approval have been verified may an authorized operator conduct **GET only** `/api/integration/v1/health` and `/api/integration/v1/capabilities` in a future approved UTC window (at most 30 minutes), using nonproduction test-only credentials held server-side. Do not test without that approval.
5. A distinct later owner decision is needed for any actual read-only pilot activation. A test approval never implies a pilot approval.

## QL-252 status / gates

| Gate | Verified state |
| --- | --- |
| Signed source proof published at checked main SHA | **0/6** |
| Public signed proof + source-CI ancestry accepted | **0/6** |
| Independently authenticated custody fingerprints and real witness | **0/6** |
| Authenticated owner permission for a named nonproduction GET test | **NOT GIVEN** |
| Authenticated gateway GET pairs and original seven-denial suites | **0** |
| Actual real GET test windows scheduled | **0** |
| Owner read-only pilot authorization | **NOT GIVEN** |
| Real business connections | **DISCONNECTED** |
| QL-181 live communications prerequisites | **12/12 HELD** |
| External writes / calls / SMS / dispatch | **0 / 0 / 0 / 0** |

`main` production GREEN, when achieved, describes deployment checks for the **disabled preview** only. It never overrides these operational `HELD` values. GitHub account membership is not service authentication. Keep Etsy/Marketplace, gifts, booking, payroll, campground access and home automation unmodified.

**Next expected Comms Hub build: QL-253 — Six-App Published Proof Origin Verification, Independent Pin-Registry Challenge Renewal & Owner TEST-Only Authorization Exception Closure (HELD).**
