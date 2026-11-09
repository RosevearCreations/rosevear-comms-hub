# QL-390 — Read-Only Cross-Application Incident Intake Simulation Ledger, Source-Scoped Deduplication & Operator Evidence Preview

**Scope: INERT_PREVIEW.** This is a deterministic, ephemeral simulation of a future Comms Hub intake operator display. It is neither a live receiver nor a connected/accepted incident ledger. No user/customer records, original owner key material, external transport, persistent data store or real operator task is used.

## Inputs and boundaries

The contract builds on [QL-388 intake V1](../../api/contracts/ql388-cross-app-intake-v1.schema.json) and [QL-389 source-signed preview](QL389_SIGNED_INCIDENT_INTAKE_GATE_PREVIEW.md). `app/src/auth/ql390IncidentSimulationLedger.ts` accepts:

- A bounded array of at most **50** synthetic `{ event, proof }` candidates, one QL-388 event and one QL-389 detached signature each.
- One **scenario-only** set of source-matched public key pins, per-source routes, assumed owner decisions, receiver readiness, replay snapshot and clock. These observations are not owner-signed real-world evidence.

Each candidate passes the QL-389 Ed25519 proof, freshness, replay snapshot and simulated policy review. Only a `PREVIEW_ONLY` candidate enters the **within-batch** comparison. A source-scoped tuple `(sourceId, messageId)` and `(sourceId, idempotencyKey)` are compared against the first synthetic event with each key.

| Operator state | Meaning | Authorized action |
| --- | --- | --- |
| `PREVIEW_NEW` | First occurrence in this one in-memory simulation | None; no incident created |
| `PREVIEW_DUPLICATE` | Same source, matching identifier and identical canonical signed event | None; no delivery or replay reservation |
| `PREVIEW_CONFLICT` | Same source and message/idempotency identifier, but different canonical event | None; show conflict for owner review |
| `HELD` | Schema, signature, trust, freshness, prior-replay or policy check failed | None; redact all claimed event metadata |

Two registered source applications may reuse the same opaque identifier without a cross-source collision. Even a valid synthetic candidate remains `PREVIEW_NEW` rather than `ACCEPTED`; the simulator never reserves a key for subsequent sessions. A repeated call always starts with a fresh map. Prior replay snapshots are read-only and caller-supplied; actual durable, atomic idempotency enforcement remains unimplemented.

## Operator evidence and privacy

- For a synthetic candidate that passes the QL-389 preview only, the row contains a sequence number, registered shell source ID, event kind, machine-readable event code, opaque correlation ID, **count** of evidence references, result and a safe explanation.
- For `HELD`, the row uses `UNVERIFIED` sender and `REDACTED` values for all untrusted event claims. It never echoes raw JSON, email, customer, attachment, signing key, signature, credential or evidence URL.
- The owner screen shows an **illustrative four-row table**, not data collected from a receiver. It has no fetch, form, mutation button, storage, export of evidence or incident-handling action.
- AI Data Platform remains authoritative for module-health evidence, capability percentages and source freshness; Comms Hub's simulation concerns communications and operator incidents only.

## Required before any production receiver

1. Real independently approved source public-key pins and original-device dual-owner decisions must be verified server-side; no scenario flag grants authority.
2. Implement a genuine authenticated receiver and atomic durable replay/idempotency ledger with source-scoped keys, expiry, race safety, source policy, rate limits, rotation and revocation.
3. Persist only authorized, properly redacted event evidence under explicit retention, role and tenant boundaries; rejected messages must not create customer records or operator work.
4. Validate first real signed source receipt and independent witness as a separate protected owner acceptance before any connection can be considered active.
5. Reconcile cross-application event IDs and completion-monitoring ownership with AI Data Platform without conflating incident handling with business tenant access.

## Evidence from this build

Synthetic Ed25519 test keys demonstrate new, duplicate, conflict, source isolation and held cases, including attempted private extra fields, missing signatures, prior replay and held master-owner policy. The tests also prove batch limits and that two independent simulation calls never share state. CI GREEN would establish software promotion, **not** live connection, enrollment, receiver activation or production incident intake.
