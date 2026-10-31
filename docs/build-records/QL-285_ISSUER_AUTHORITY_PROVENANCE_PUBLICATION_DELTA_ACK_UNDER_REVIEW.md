# QL-285 — Issuer authority challenge audit, owner response provenance & six-app publication delta worklist

**Release goal:** trace pending independent reviewer authority prerequisites, quarantine nonsecret owner-response provenance claims, and examine the latest independently observed immutable six-app publication exception delta. **ACK Delivery Evidence: UNDER REVIEW / PARKED FOR LATER.** The separate source integration authorization is still **DISCONNECTED / HOLD**, not waived.

## Actual public observations, 31 October 2026

At **2026-10-31T13:58:08Z (09:58 Eastern)**, public GitHub `main` refs were resolved for each registered source, then `docs/integration/ql246-source-proof.json` was requested at the exact immutable SHA using the public GitHub contents API. These were genuine public-only requests; no source gateway, owner, signer, reviewer, custodian or private witness session was accessed. Every pinned original path returned **HTTP 404 / Not Found**. A 404 does not prove an original was authenticated, only that the exact path was absent at the checked pin/time.

| Source / public repository | QL-284 exact `main` SHA | QL-285 exact `main` SHA | Change | Pinned Proof-B |
| --- | --- | --- | --- | --- |
| AI Data Platform (`ai-data-platform`) | `1df63b8f4b9995609237a8285fff435c073638c4` | `d2677d2fb0fce8a6aa2aaf76675bcbb55964e79f` | Moved | HTTP 404 |
| Devil n Dove (`devilndove-site`) | `6d077326f755fcdb301f1bbf2562dc70e95968a3` | `98d729f56d56a850a7d94a987e90313f362bc519` | Moved | HTTP 404 |
| Rosie Dazzlers (`rosiedazzlers`) | `c09e58f07474321df01caa54c7a38f527cdc7873` | `907a4f77b29cd56b3e717f06f4c4a1a458f28e35` | Moved | HTTP 404 |
| Yard Workers (`yw`) | `5027fcb6579f09c521bfdae1095efe39d98ffe64` | `5027fcb6579f09c521bfdae1095efe39d98ffe64` | Unchanged | HTTP 404 |
| iCamp (`iCamp`) | `3c72ff6e2b187a190a34d9596bd6228053b740ea` | `e835caf206712d3d4c8104d329417d32f8e7f18c` | Moved | HTTP 404 |
| Rosevear AI Hub (`rosevear-ai-hub`) | `81b2aa449714539c28fd6f8ee4716075c78d3850` | `422fa64f0d0220ee4ddf33ba0bb27ab617ab122d` | Moved | HTTP 404 |

**Result:** five source main SHAs moved, one was unchanged; **all six publication exceptions remain open**; **0/6 original signed Proof-B artifacts accepted**. The next independent public GET is due no later than **2026-11-01T13:58:08Z**, or earlier when a newer source claim/notices or drift arrives. The UI can recalculate snapshot age but cannot perform an automatic network poll. A later HTTP 200 would show only path existence; it would not independently authenticate signer identity or custody.

## QL-285 operator implementation

1. **Reviewer issuer trust authority challenge audit:** session-only QL-284 cross-check reference drafts feed into a seven-gate audit of independent issuer organization/role authority, reviewer scope, witnessed SPKI pin/rotation/revocation, nonce/audience/expiry, original signed return, witness/custodian custody and owner TEST consent. Each gate remains unsatisfied. The audit is `AUTHORITY_CHALLENGE_PRECONDITIONS_ONLY`; no challenge is issued, key accessed, reviewer authenticated or approval conferred. Forged QL-284 gate states and invalid clocks fail closed.
2. **Owner response provenance reconciliation:** requires an unresolved, unverified QL-284 response claim. Operators may classify a claimed owner/source, custodian or independent witness *reference* with a nonsecret case ID. The claim is explicitly `QUARANTINED_REFERENCE_CLAIM`, `LOCAL_UNVERIFIED_REVIEW`, with owner identity unauthenticated, original receipt unverified, no delivery, no routing and no exception closure. The exact QL-284→QL-285 SHA diff remains attached to each draft.
3. **Six-app publication exception delta worklist:** all six actual immutable source refs and HTTP results are listed, with moved/unchanged filters, a public pinned link, notice staleness/freshness and explicit 24-hour recheck due. A linked manual local work item can be prepared from a QL-284 unexecuted source review draft, but neither scheduling nor any new GET occurs. Distinguish the actual public observation from optional local future tasks.
4. **ACK workstream preserved as UNDER REVIEW / PARKED FOR LATER:** no ACK delivery evidence collection, follow-up aging, notifications, escalation or original delivery receipt acceptance. This direction is independent of source integration security, which continues **DISCONNECTED / HOLD** until genuine original proofs, authenticated GET identity and owner TEST-only approval.
5. **Operator privacy and accessibility:** keyboard-reachable labels/forms, visible focus, responsive layout, forced-colors and reduced-motion handling. All QL-285 drafts are browser-memory-only with explicit clear/copy actions; no credential storage, secret fields, live calls, SMS, source writes, private signer operations or external routing.

## Release checks

- `npm run verify:ql285`: QL-285 and historical QL-284–QL-270 operator regression tests.
- `npm --prefix app run test`: complete application suite.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs`: operator security and persistence boundary check.
- `npm --prefix app run build`: TypeScript and production Vite bundle.
- Feature CI and `dev` CI must pass app-build and Worker build; all five exact `main` production checks must pass. Local/`dev`/`main` Git trees must match and the live Worker HTML JS/CSS must be byte-identical to the final locally compiled assets.

## Next proposed build

**QL-286 — Issuer Authority Review Outcome Comparison, Original Proof-B Provenance Conflict Follow-Up & Six-App Source Exception Recheck Aging (ACK Delivery Evidence Under Review).** Any genuine evidence must be independently supplied and checked; this planned review does not claim it exists.
