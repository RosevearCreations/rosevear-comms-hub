# QL-388 — Unified Cross-Application Notification & Incident Intake Contracts

**Status:** software contract / DESIGN_ONLY. This document grants no connection, signing, tenant, receiver, or transport authority.

## Ownership and scope

- Rosevear Comms Hub defines communications, notifications, operator incidents and their eventual authorized intake.
- AI Data Platform owns health, progress, module-completion percentages, monitoring evidence and source freshness. Do not redirect those data feeds through this incident contract.
- Publishers must be one of the six fixed **shell-level** source IDs in QL-386: `yw`, `icamp`, `rosiedazzlers`, `devilndove`, `ai-data-platform`, `rosevear-ai-hub`. A sample business (for example, Rosevear Landscaping or Camp Rosevear) is **not** an application source.
- QL-387 routing remains `DESIGN_ONLY`; this contract does not create any executable route.

## V1 envelope

The canonical machine-readable JSON Schema is [`api/contracts/ql388-cross-app-intake-v1.schema.json`](../../api/contracts/ql388-cross-app-intake-v1.schema.json). The in-app TypeScript validator is `app/src/auth/ql388CrossAppIntake.ts`.

| Field | Purpose |
| --- | --- |
| `contractVersion` | Exactly `rosevear.comms.intake.v1`; future changes require coordinated version negotiation. |
| `messageId` | Opaque unique event ID; not a customer identifier. |
| `correlationId` | Opaque cross-application investigation ID for a single trace. |
| `idempotencyKey` | Opaque stable deduplication key for retries of the **same** source event. |
| `sourceId` | Fixed QL-386 application shell identity, independently authenticated at the future receiver. |
| `destinationId` | Exactly `rosevear-comms-hub`; this is a logical destination, not an enabled endpoint. |
| `tenantScope` | Exactly `shell` in V1. No tenant/customer/business records. |
| `kind` | `notification` or `incident`. |
| `category` | `integration`, `security`, `operations`, or `service`. Module-completion reporting uses AI Data Platform instead. |
| `severity` | `info`, `warning`, or `critical`; not an auto-escalation permission. |
| `eventCode` | Uppercase catalogue key, not a human free-text description. Render approved text locally after authorization. |
| `occurredAt` | ISO-8601 UTC occurrence timestamp; freshness and replay still require independent server checks. |
| `evidenceRefs` | Maximum five opaque references, never URLs, private attachments or secrets. |

Reject unknown fields, versions, identities, categories, missing fields, non-shell scope, malformed IDs, duplicate evidence references, external URLs and free-form payloads. The validator intentionally accepts no `message`, `summary`, `customer`, `tenantId`, contact data, arbitrary `payload`, attachment bytes or credentials. Even an envelope that matches the schema is only `DESIGN_ONLY`, not trusted or received.

## Safe illustrative envelope (NOT a real signed event)

```json
{
  "contractVersion": "rosevear.comms.intake.v1",
  "messageId": "notification-ql388-0001",
  "correlationId": "correlation-ql388-0001",
  "idempotencyKey": "dedupe-ql388-0001",
  "sourceId": "yw",
  "destinationId": "rosevear-comms-hub",
  "tenantScope": "shell",
  "kind": "incident",
  "category": "integration",
  "severity": "warning",
  "eventCode": "SOURCE_HEALTH_STALE",
  "occurredAt": "2026-11-08T00:00:00Z",
  "evidenceRefs": ["release:QL388DEMO0001"]
}
```

## Integration and security handoff

1. Each participating app maps its approved machine-readable events to this exact envelope. Apps must keep operational business data behind their existing tenant boundaries.
2. A future receiver independently verifies the source signer and pinned shell identity, owner approvals, permitted source/event/destination relationships, envelope version, timestamp freshness, idempotency, replay state, rate limits and evidence-reference access before processing. A client boolean, schema match or release GREEN cannot satisfy these checks.
3. Only then may a future separately approved service persist an incident, perform deduplication, create an operator task or deliver notifications. None of those capabilities are introduced in QL-388.
4. The AI Data Platform may correlate the opaque `correlationId` with its independent telemetry; this contract must not make Comms Hub authoritative for completion percentages or health evidence.
5. Sensitive or tenant-level cases need an independently approved, consent-aware contract and explicit receiver authorization. No cross-tenant access by default.

## Acceptance evidence

- Automated tests cover valid notification and incident *designs*, unknown sources, tenant leakage attempts, extra payloads, free-form content, URL references, mismatched destinations/versions and duplicate evidence.
- No network request, source enrollment, production receiver, authorization grant, persistence or message delivery is implemented by this build.
- Passing CI establishes only the readiness of these software artifacts. Live source-to-Comms-Hub connection status remains independently verifiable and must not be inferred from CI.
