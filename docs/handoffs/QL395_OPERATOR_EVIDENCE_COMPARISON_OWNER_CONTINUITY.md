# QL-395 — Operator Evidence Review Comparisons, Authorization Drift Resolution Guidance & Owner Decision Continuity

## Owner review contract

QL-395 builds on the bounded, in-memory QL-394 decision-history preview. It compares two **ordered observations from the same synthetic correlation and registered shell**. It never reads a production incident, original owner decision, private signing material or customer/tenant record.

The owner drilldown offers three fixed comparison windows for one illustrative Devil n Dove workshop group:

1. `09:00 → 09:03`: simulated source-owner gate change and source-pin reference drift.
2. `09:03 → 09:06`: simulated passing gates return to HOLD.
3. `09:00 → 09:06`: endpoints are compared, **while intermediate drift alerts remain visible**.

QL-395 obtains its history by revalidating all QL-394 source-scoped snapshots and claims. A missing, duplicate, malformed, reversed or temporally invalid comparison is **HOLD with no partial disclosure**. Inputs remain bounded by the QL-394 limits of 12 observations and 50 claimed references per observation.

## Comparison and guidance

| Displayed change | Meaning | Trust boundary |
| --- | --- | --- |
| `SIMULATED_GRANT_CHANGE` | A demo gate changed from HOLD to simulated pass | **No authority granted**; original owner decision and scope required |
| `REVERTED_TO_HOLD` | A demo gate changed from simulated pass to HOLD | Recheck original evidence; do not act on the old scenario |
| `REFERENCE_CHANGED` | Claimed evidence references differ | Investigate key custody, source pins and witness provenance |
| `PROVENANCE_CHANGED` | Evidence claim availability/freshness changed | Independently inspect original source evidence; claimed freshness is not proof |
| `UNCHANGED` | The scenario gate is unchanged at the selected endpoints | Intermediate drift alerts still matter; unchanged is not verified |

For each QL-394 drift alert inside the selected window, the operator sees fixed, bounded, non-actionable resolution guidance:

- `UNVERIFIED_GRANT_CHANGE`: obtain independent original owner decision and scope.
- `GATE_REVERSAL`: recheck decision custody and original evidence.
- `PIN_REFERENCE_DRIFT`: independently reconcile source-bound key pin, custody and witness record.
- `CROSS_SOURCE_REFERENCE_REUSE`: independently investigate both shell identities; never infer cross-tenant permission.

Guidance items remain `OPEN_REVIEW_ONLY` / `NOT_ATTESTED` and cannot be marked resolved by this preview.

## Separate owner continuity

The source-owner and master-owner gates are shown separately for each affected source. Their earlier and later scenario decisions are preserved alongside `originalOwnerEvidence: NOT_VERIFIED` and `continuity: HOLD_RECHECK_ORIGINAL`. A simulated pass never automatically renews, transfers, approves or authorizes either owner's original decision.

No sender, signature verifier, owner approval endpoint, receiver enrollment, database persistence, replay reservation, alert dispatch or background polling is added. The AI Data Platform remains responsible for application/module completion evidence; Comms Hub owns communications and incident routing only when independently authorized.

## Release acceptance

Verify targeted QL-395 comparison and owner drilldown tests, run the full Vitest suite and TypeScript/Vite build, then require independent `dev` and `main` CI and post-merge `main` workflow conclusions GREEN. GREEN validates software checks; it does **not** certify source-owner enrollment, signing custody or a live receiver.
