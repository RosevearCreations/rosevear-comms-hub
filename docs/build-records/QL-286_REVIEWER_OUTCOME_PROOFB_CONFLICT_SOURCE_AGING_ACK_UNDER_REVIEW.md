# QL-286 — Reviewer authority outcomes, original Proof-B provenance conflict follow-up and six-app public source aging

**Release posture:** actual public source recheck plus **session-only unverified operator comparison**. Six-App Acknowledgement Delivery Evidence remains **UNDER REVIEW / PARKED FOR LATER**, as explicitly directed by the owner. Its status does not lift the separate **DISCONNECTED / HOLD** integration security gate.

## Real public source observation, 31 October 2026

At **2026-10-31T14:28:28Z (10:28 Eastern)** the public GitHub `main` refs for all six source applications were resolved, followed by immutable public GitHub contents GET requests for `docs/integration/ql246-source-proof.json` at those exact SHAs. These were not source-app gateway requests, authenticated GETs, owner approvals, private witness calls or signer operations. All six exact immutable paths returned **HTTP 404 / Not Found**.

| Source / GitHub repository | QL-285 immutable `main` SHA | QL-286 immutable `main` SHA | Delta | Exact original Proof-B path |
| --- | --- | --- | --- | --- |
| AI Data Platform (`ai-data-platform`) | `d2677d2fb0fce8a6aa2aaf76675bcbb55964e79f` | `61b5ee0a479345089df5ddc3043b6b7c2243eb65` | Moved | HTTP 404 |
| Devil n Dove (`devilndove-site`) | `98d729f56d56a850a7d94a987e90313f362bc519` | `ee86e795c5b47a4890d002d8027d8de2d54c2a3e` | Moved | HTTP 404 |
| Rosie Dazzlers (`rosiedazzlers`) | `907a4f77b29cd56b3e717f06f4c4a1a458f28e35` | `2675049179f5c43e8342880579e3ccc04d144a5b` | Moved | HTTP 404 |
| Yard Workers (`yw`) | `5027fcb6579f09c521bfdae1095efe39d98ffe64` | `5027fcb6579f09c521bfdae1095efe39d98ffe64` | Unchanged | HTTP 404 |
| iCamp (`iCamp`) | `e835caf206712d3d4c8104d329417d32f8e7f18c` | `2e66d00e3aefdaaa68118c2f5abead4e49aacb02` | Moved | HTTP 404 |
| Rosevear AI Hub (`rosevear-ai-hub`) | `422fa64f0d0220ee4ddf33ba0bb27ab617ab122d` | `fd04c17eecb50189745945d57ea44626c52eaa54` | Moved | HTTP 404 |

**Interpretation:** 5/6 exact source main SHAs moved, 1/6 unchanged, **6/6 immutable Proof-B original publication exceptions still open**. No original signer, independent reviewer, trusted key pin, owner provenance, custodian receipt or gateway identity is authenticated. Even a future HTTP 200 only establishes file presence at a pin, not genuine signature/custody acceptance. Next manual public GET due no later than **2026-11-01T14:28:28Z (10:28 Eastern)**, sooner if a new claim, notice or drift arrives. No automatic polling is enabled.

## QL-286 implementation and release invariants

1. **Issuer authority review outcome comparison.** The operator selects an intact, strictly pending QL-285 issuer challenge audit and a nonsecret local outcome category (uncorroborated chain, missing signed challenge return or unconfirmed reviewer scope). All seven gates remain unsatisfied, 0 independently reviewed, challenge NOT ISSUED, signer/reviewer NOT AUTHENTICATED. A forged prior authority, validated gate or invalid chronology fails closed. Comparison is explicitly `LOCAL_OUTCOME_COMPARISON_ONLY`, never a trusted attestation.
2. **Original Proof-B provenance conflict follow-up.** An intact QL-285 quarantined local provenance claim is required for an optional conflict review. The supported categories record changed source pin, missing original custodian receipt or uncorroborated owner–witness chain; each draft carries both QL-285 and actual QL-286 source SHAs. Original Proof-B remains HTTP 404, owner NOT AUTHENTICATED, receipt NOT VERIFIED, conflict OPEN; external routing or resolution is unavailable. Case references reject obvious secret-bearing values.
3. **Six-app source exception recheck aging.** Show all six genuine immutable public observations, changed/unchanged filters, 24-hour due, 24/72-hour aging bands, post-snapshot notices, stale notice pins and linked session-only delta work items. A QL-285 unexecuted source work item can create an optional local unscheduled QL-286 aging follow-up. Clicking Recalculate Age does **not** trigger a new GET. Records never imply an accepted original or a scheduled request.
4. **ACK owner decision preserved.** Six-App Acknowledgement Delivery Evidence Preconditions remains **UNDER_REVIEW / PARKED_FOR_LATER** with no ACK evidence collection, delivery receipt work, escalation or acknowledgement aging. This is independent of original Proof-B source security, which stays **DISCONNECTED / HOLD** until the complete real independent chain and TEST-only owner authorization arrive.
5. **Accessibility and privacy.** Responsive three-tab IT command review with labels, keyboard focus, forced-colors, reduced-motion and clear read-only status. QL-285 case drafts now survive panel changes in parent in-memory state for QL-286 comparison. QL-286 local case drafts can be cleared and copied as an explicitly unverified JSON packet. No persistent secrets, actual calls/SMS, private signer, real source writes or external notifications.

## Verification and promotion requirements

- `npm run verify:ql286`: QL-286 plus QL-285→QL-270 focused regression suites.
- `npm --prefix app run test`: full application suite.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs`: security/persistence boundary.
- `npm --prefix app run build`: TypeScript and production bundle.
- Feature and `dev` CI: `app-build` and `Workers Builds: rosevear-comms-hub` successful; all five **exact production `main`** check runs successful after promotion. Verify local/`dev`/`main` tree equality and live Worker JS/CSS SHA-256 equality to final local build before reporting Production GREEN.

## Next proposed build

**QL-287 — Independent Reviewer Authority Decision Evidence Readback, Original Proof-B Custodian Conflict Disposition Queue & Six-App Source Refresh Drift Follow-Up (ACK Delivery Evidence Under Review).** Genuine original evidence and authorization remain external prerequisites; QL-287 would not assume their arrival.
