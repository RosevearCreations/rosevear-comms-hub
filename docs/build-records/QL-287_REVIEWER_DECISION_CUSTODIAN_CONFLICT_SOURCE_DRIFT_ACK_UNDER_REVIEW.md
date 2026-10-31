# QL-287 — Independent reviewer authority decision readback, original Proof-B custodian conflict disposition queue and six-app source drift follow-up

**Scope:** actual immutable public source recheck and local unverified operator review only. Six-App Acknowledgement Delivery Evidence is still **UNDER REVIEW / PARKED FOR LATER**. The six source integrations remain independently **DISCONNECTED / HOLD**; there is no authenticated source gateway test, real calls/SMS, custodian delivery, reviewer attestation or owner TEST approval.

## Actual public GitHub recheck on 31 October 2026

At **2026-10-31T15:08:06Z (11:08 Eastern)**, the public GitHub `main` ref of each registered source was inspected. Then the original source proof path `docs/integration/ql246-source-proof.json` was requested by the public GitHub contents API at its exact immutable SHA. **All six paths returned HTTP 404 / Not Found**. These are real public repository reads; neither private signer keys, authenticated GET credentials nor a source application gateway were used.

| Source (`RosevearCreations/`) | QL-286 immutable main SHA | QL-287 immutable main SHA | SHA drift | Original Proof-B pinned path |
| --- | --- | --- | --- | --- |
| `ai-data-platform` | `61b5ee0a479345089df5ddc3043b6b7c2243eb65` | `067204cebebfac5c36cf3893bbdd8859e5ffb425` | Moved | HTTP 404 |
| `devilndove-site` | `ee86e795c5b47a4890d002d8027d8de2d54c2a3e` | `fd3089ed19f2fd081f1b583de87ada650fa50fee` | Moved | HTTP 404 |
| `rosiedazzlers` | `2675049179f5c43e8342880579e3ccc04d144a5b` | `2564268ba3dc5e3483395600169a237749b1f9eb` | Moved | HTTP 404 |
| `yw` | `5027fcb6579f09c521bfdae1095efe39d98ffe64` | `7e9a2029fdfdeddc89aa8c23d23b25cfb16ff415` | Moved | HTTP 404 |
| `iCamp` | `2e66d00e3aefdaaa68118c2f5abead4e49aacb02` | `4f42e969b192fbc29f64cdd3766ee118e92e42d3` | Moved | HTTP 404 |
| `rosevear-ai-hub` | `fd04c17eecb50189745945d57ea44626c52eaa54` | `66a73c04342fdfd1bcbb2666c6d8dae37840ced1` | Moved | HTTP 404 |

**Result:** all six SHAs moved since the preceding public snapshot, six original publication exceptions remain open, 0/6 signed artifacts accepted and 0 authenticated gateway GETs. Next independent public recheck due **2026-11-01T15:08:06Z (11:08 Eastern)**, or sooner upon drift, claim or notice arrival. A later 200 only shows file presence; original signature, trust anchor, custody, witnessed pin and tenant authorization remain separate prerequisites.

## Implementation

1. **Independent reviewer decision evidence readback:** requires an intact QL-286 *pending* reviewer outcome comparison. Only three categories of claimed nonsecret decision/witness/reference can be recorded. Each is `REFERENCE_READBACK_ONLY / LOCAL_UNATTESTED_DECISION_REVIEW`, with original signature NOT VERIFIED, reviewer/issuer NOT AUTHENTICATED, independent decision NOT RECEIVED, owner approval NOT GIVEN, accepted FALSE. Forged gate completion, authenticated signer or bad chronology fails closed.
2. **Original Proof-B custodian conflict disposition queue:** requires an intact unresolved QL-286 quarantined provenance conflict. Records local reason (`ORIGINAL_ARTIFACT_STILL_MISSING`, `CHAIN_OF_CUSTODY_UNCORROBORATED`, `SOURCE_DRIFT_REQUIRES_ORIGINAL_RECHECK`) and both pinned source SHAs. Queue status is `LOCAL_UNSENT_DISPOSITION_QUEUE`, externally queued FALSE, delivered FALSE, resolved FALSE; no original custody receipt is accepted or private custodian contacted. Unchanged source cannot be misclassified as drift.
3. **Six-source refresh drift follow-up:** actual six immutable public refs, six 404s, latest-vs-QL-286 SHA change comparison, stale notice pins and post-snapshot notices, 24-hour recheck due and manual-only aged readback. A QL-286 unscheduled local aging item can become an unscheduled QL-287 local source follow-up, but the UI cannot schedule a real GET or write to a source repository. It distinguishes snapshot age calculation from an actual fresh GET.
4. **Explicit owner parking:** Six-App Acknowledgement Delivery Evidence Preconditions stays **UNDER_REVIEW / PARKED_FOR_LATER**, with no acknowledgement delivery, escalation, follow-up aging, routing or receipts. Original Proof-B authorization gates remain **DISCONNECTED / HOLD**; they are not bypassed by the ACK parking decision.
5. **Operator use:** three keyboard-accessible cards in the IT command help area, with labeled controls, responsive layout, visible focus, forced-colors/reduced-motion support, source links, and read-only JSON export. QL-286 pending review drafts remain in-memory across panel switches so QL-287 can read their antecedents. No new storage, secrets, calls, SMS, source integration writes or private evidence operations.

## Release criteria

- `npm run verify:ql287`: QL-287 plus all current operator regression suites through QL-270.
- `npm --prefix app run test`: complete suite.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs`: operator security/persistence boundary.
- `npm --prefix app run build`: TypeScript and Vite production bundle.
- Exact tested Git tree promoted feature→`dev`→`main` with successful application and Worker checks at each review stage; **all five production `main` checks** green. Verify live Worker HTML references QL-287 JS/CSS, then compare exact SHA-256 of the live assets with final local build.

## Next proposed build

**QL-288 — Reviewer Decision Receipt Independence Audit, Original Custodian Resolution Evidence Preflight & Six-App Immutable Source Exception Recheck Queue (ACK Delivery Evidence Under Review).** No future receipt or source publication is presumed to exist.
