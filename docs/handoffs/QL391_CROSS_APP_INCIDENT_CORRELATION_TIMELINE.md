# QL-391 — Cross-Application Incident Correlation, Operator Review Timeline & Evidence Freshness Tracking

**Promotion scope: read-only, synthetic `INERT_PREVIEW`.** This build adds correlation and freshness read models to the existing QL-390 in-memory demonstration; it does **not** install an intake receiver, persist incidents, deliver notifications, merge business records, approve keys or confer cross-application permissions. A green build means the preview code passed its checks, not that six applications are live-connected.

## Correlation boundary

- Inputs are a bounded QL-390 `INERT_PREVIEW` ledger of at most 50 scenario-signed candidate events and a separate caller-provided evidence observation list of at most 100 entries.
- Only signed-preview QL-390 rows (`PREVIEW_NEW`, `PREVIEW_DUPLICATE` and `PREVIEW_CONFLICT`) can join a group. `HELD` claims stay excluded and are redacted, including their event timestamps. Successful synthetic signature checks are not authentic original-source evidence.
- Rows from different shell sources may share a **bounded opaque correlation ID**. That makes one *illustrative* group; it does not imply the same customer, tenant, operation, incident ownership or authority to route between applications.
- Operator timeline entries sort by their signed synthetic event timestamp, with original ledger sequence as the tie-break. Group order uses the latest event time. A duplicate or conflict remains visibly labelled; the preview never resolves it automatically.

## Evidence freshness is independent of event time

An evidence observation has `{ sourceId, correlationId, state, checkedAt }`, where `state` is `PRESENT` or `MISSING` and `checkedAt` is a UTC ISO timestamp or null. Freshness applies only when **both source ID and correlation ID match**. It cannot be derived from the incident's `occurredAt` field.

| Label | Synthetic meaning |
| --- | --- |
| `CURRENT_SIMULATED` | One valid matching PRESENT observation checked within 10 minutes, and no more than 1 minute into the future |
| `STALE` | Matching observation exists but is older than 10 minutes |
| `MISSING` | Matching observation explicitly reports missing evidence |
| `UNKNOWN` | No matching source/correlation observation supplied |
| `INVALID` | Matching observation timestamp is malformed or beyond the permitted future tolerance |
| `CONFLICT` | More than one observation matches the same source/correlation pair; none is selected as truth |

Group freshness reports the least reassuring label among its events, preserving review flags instead of claiming that the whole group is current. The clock and observations are untrusted scenario inputs. Invalid, oversized or malformed ledger/readback inputs return `HOLD` with no groups.

## Owner UI and operational separation

The QL-391 section of `OwnerSixAppDrilldown` renders a fixed two-row Yard Workers/iCamp illustration. It has an accessible caption, column/row headers, dark styling, narrow-screen overflow, an explanatory HOLD message and a documentation link. It contains no receiver fetch, mutation control, tenant data, message send, acknowledgement or operator assignment.

AI Data Platform remains authoritative for module-health evidence, completeness scoring and observed source freshness; Comms Hub uses only explicitly authorized, source-scoped evidence references to support future communication/incident operator workflows. The sample Camp Rosevear and Rosevear Landscaping businesses are **tenants**, not extra platform source identities.

## Production prerequisites not covered by QL-391

Original source-signing enrollment, dual owner approval and independently witnessed receiver proof; a server-side verified source/correlation readback; atomic replay reservations; persistent incident audit/history; RBAC, tenant isolation and retention policy; a reviewed mapping to AI Data Platform evidence provenance; and explicit authorization for live notifications and incident operator actions. None can be inferred from a browser simulation.

Test coverage uses generated test Ed25519 keys and synthetic QL-388/QL-389/QL-390 envelopes. It exercises chronology across two source IDs, shared vs distinct opaque groups, duplicate states, held-claim redaction, source-scoped evidence freshness, staleness boundary and fail-closed readbacks.
