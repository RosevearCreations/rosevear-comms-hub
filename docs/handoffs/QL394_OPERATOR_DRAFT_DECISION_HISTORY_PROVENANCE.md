# QL-394 — Operator Draft Decision History, Approval Evidence Provenance & Cross-Source Authorization Drift Alerts

## Owner-visible scope

This build adds an **inert, read-only, in-memory illustration** to the six-app owner drilldown. It follows QL-391 incident correlation, QL-392 operator review and QL-393 source-scoped draft preview. No live evidence, signing key, owner approval, receiver acceptance, task, notification or customer information is fetched or changed.

The fixed Devil n Dove workshop example contains three synthetic observations, each with the five QL-393 owner gates: `SOURCE_OWNER`, `MASTER_OWNER`, `SOURCE_PIN`, `RECEIVER` and `CONSENT`. The chronological table shows scenario decisions and provenance classes (`MISSING`, `CONFLICT`, `INVALID`, `STALE_SIMULATED`, `SCENARIO_REFERENCE_ONLY`). An opaque reference is **a claim**, not proof of signing authority, original custody, consent or independent witness.

## Drift and review guidance

| Alert | Read-only interpretation | Required original evidence |
| --- | --- | --- |
| `UNVERIFIED_GRANT_CHANGE` | A synthetic gate changed from HOLD to simulated pass | Separate source/master owner decision as appropriate and independently validated original proof |
| `GATE_REVERSAL` | A simulated pass returned to HOLD | Recheck original approval and current source authorization before proposing action |
| `PIN_REFERENCE_DRIFT` | A claimed source-signing reference changed | Independently witnessed signing-pin and custody reconciliation |
| `CROSS_SOURCE_REFERENCE_REUSE` | A claimed reference appears under multiple distinct shell source IDs | Source-specific identity isolation and original evidence inspection |

All alerts are advisory; none is a live alert or incident. Missing, stale, malformed or conflicting references do not become verified by appearing in a table. Event times and claimed evidence-check times are separate; the latter receives a synthetic ten-minute freshness label, not a production attestation.

## Safety and boundaries

- The model caps input at 12 snapshots and 50 claimed references per snapshot, validates opaque IDs and known shell sources, rejects invalid/future observations, and fails closed with **no partial history** on invalid scope or scenario.
- Only sources with a QL-393 affected draft for the selected correlation can enter the history; tenant businesses such as Camp Rosevear are never independent master-shell sources.
- The historical snapshots are local constants; no network, persistence, approval API, transport, replay-reservation, private key or signer capability is introduced.
- Even five `SIMULATED_PASS` gates remain `SCENARIO_READY_ONLY` and cannot enable sending or persistence under QL-393. A screen labelled GREEN by CI demonstrates software integrity, **not** original-source operational authorization.

## Original proof prerequisites for a later, separately authorized deployment

1. Independently verify source owner and master owner identity, scoped decisions and original witness chain.
2. Verify source-bound signing key custody/pins and server-side signature validation.
3. Enroll and attest the private receiver with durable, atomic replay/idempotency handling.
4. Bind operator consent, scope, privacy, tenant isolation, retention and audit evidence to each action.
5. Only then propose a separate production-capable intake/approval workflow with its own threat review and owner acceptance.

## Verification

Vitest coverage exercises chronological sorting, missing/invalid/stale/conflicting reference classifications, gate transitions, cross-source reference reuse, invalid scope, duplicate/future/oversized snapshots and an accessible, control-free owner preview. `npm --prefix app test` and `npm --prefix app run build` must pass before promotion through `dev` and `main`.
