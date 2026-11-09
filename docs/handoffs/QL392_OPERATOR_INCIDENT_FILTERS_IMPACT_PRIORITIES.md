# QL-392 — Operator Incident Review Filters, Source Impact Summaries & Freshness-Aware Follow-Up Priorities

**Scope: read-only, synthetic `INERT_PREVIEW`.** This build extends [QL-391 correlation/timeline](QL391_CROSS_APP_INCIDENT_CORRELATION_TIMELINE.md). It does not connect real sources, persist incidents, send notifications, acknowledge alerts, assign operators, merge tenants or grant any route or owner authority. Repository production-green status certifies tested preview software only.

## Review inputs, filters and deterministic priorities

The pure `reviewOperatorIncidents` function consumes a bounded QL-391 correlation preview and a filter triple:

| Filter | Allowed values | Behaviour |
| --- | --- | --- |
| Shell source | `ALL` or one of six registered source IDs | Retain groups containing that source; shared cross-source group remains synthetic |
| Evidence review | `ALL`, `ATTENTION`, `CURRENT` | Show any, a group needing evidence review, or only all-current/monitor-only groups |
| Follow-up priority | `ALL`, `REVIEW_NOW`, `VERIFY_EVIDENCE`, `MONITOR_ONLY` | Filter deterministic suggestions, not authorized tasks |

The projection operates on at most **50 synthetic events** across at most 50 distinct opaque correlation groups. It validates registered shell IDs, source membership, chronological timestamps, unique group IDs, allowed event states and freshness codes. HELD rows, tenant IDs, malformed records, unknown filter values and oversized input must not generate a displayable review group.

Priorities are calculated **from the individual QL-391 event states and evidence observations**, not trusting a potentially inconsistent aggregate freshness label:

1. `REVIEW_NOW`: at least one synthetic canonical-event conflict, conflicting evidence observation or invalid readback.
2. `VERIFY_EVIDENCE`: no higher-priority conflict, but some source/correlation evidence is missing, stale or unknown.
3. `MONITOR_ONLY`: all supplied synthetic observations are current and none of the events is conflicting.

Result order is priority first, then newest synthetic event. Each group gets a safe, fixed-language suggestion. Nothing is queued, escalated, transmitted or acknowledged.

## Six-source impact summary

For each source in the master registry, the read model reports distinct correlation-group membership, timeline-entry count, groups with synthetic evidence concerns and highest suggested priority. A shared group can count toward the impact of two source applications, but it is **one group** in the overall denominator; retries and duplicate event entries never multiply the group count.

Impact summaries intentionally represent **all illustrative groups before filters**. They do not silently change totals when an operator filters the result list. A source with no sample groups reports `0` only for examples—it does not report zero real incidents, a verified live connection or operational health.

## Accessible owner review presentation

The `OwnerSixAppDrilldown` QL-392 section supplies three labelled keyboard-operable selects, live result-count feedback, a highest-priority-first table, a six-row source impact table, a no-matches explanation, high-contrast focus rings and horizontal table scrolling on narrow displays. Example rows cover Yard Workers, iCamp, Devil n Dove, Rosie Dazzlers and the local AI Hub; AI Data Platform is still shown in the impact registry with zero synthetic examples. The displayed HOLD note explicitly excludes live operator and tenant operations.

## Before extending to real operator intake

Original owner-signing evidence, independently verified per-source authority, a server-side replay ledger, durable and tenant-scoped incident records, route approvals, source-to-evidence provenance, authorization-filtered cross-app correlation, privacy retention and operator action audit must be separately implemented and accepted. AI Data Platform remains the authority for module completion/evidence health; Comms Hub may only coordinate authorized communications and incident review.

Tests cover all three filters, source totals, deterministic priority sorting, stale-evidence drift, absent-source views, held redaction, invalid inputs and the accessible read-only owner interaction. Successful tests and deployment must never be described as live incident receiver activation.
