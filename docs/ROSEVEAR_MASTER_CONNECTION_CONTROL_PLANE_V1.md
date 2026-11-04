# Rosevear Master — Database-driven autonomous connection control plane v1

**QL-330 specification, not a live deployment.** There is no master SSO, enrolled peer, provisioned vault or approved source-owner TEST in this release. Six connections stay DISCONNECTED / HOLD; Windows relay OFF; ACK UNDER_REVIEW.

## Desired operation

After a one-time legitimate trust bootstrap, source-owner signatures, and the owner's scoped TEST permission, the master should automatically discover peer contracts, read nonsecret metadata, reconcile schema versions, resolve approved vault-key handles, perform signed scoped GET checks through the AI Data Platform broker, verify returned receipts, quarantine failures, monitor source freshness, and manage portal events and reports without copying or manually editing environment-variable values.

A database row alone cannot prove a peer identity or generate its secret. Do not store API keys, refresh tokens, signing private keys or a decryption root key in ordinary database fields. The root of trust MUST be independently secured in a managed Vault/KMS. The database stores only opaque key handles and source-verified policy metadata. Nothing secret reaches a browser, a report or source control.

## Proposed protected database — NOT APPLIED

[Fail-closed PostgreSQL schema](../database/proposals/ql330_master_connection_control_plane.sql) is a design proposal. It creates a private schema with no public access grants or policies and FORCE RLS on every table. Do not run it in production without naming the authoritative project, implementing trusted master/server roles and testing SQL allow/deny.

| Tables | Purpose |
| --- | --- |
| application_shells and child_tenants | Four business application shells, two supporting services, separate source-owned child identities |
| managed_key_handles | Opaque MANAGED_VAULT/MANAGED_KMS references, key version, revocation and rotation metadata, never secret material |
| connection_profiles | Exact source shell and tenant, pinned source revision, allowed GET path, scoped nonproduction profile, HOLD state |
| procedure_versions and procedure_steps | Immutable version proposals, mandatory gate order, audit and independent promotion |
| authority_evidence and connection_rehearsals | Original signed proof digests, issuer decisions, synthetic UNSENT NO-GO attempts |
| portal_event_definitions and portal_event_receipts | Typed child-scoped event receipts without customer names or message bodies, explicit retention and consent |
| report_definitions and report_run_receipts | Versioned source-lineage/freshness and per-shell/child access rules |
| security_audit_receipts | Identity-scoped change/denial evidence and source digest |

Current SQL only defines schemas; NO tables were created in a user database and NO credentials or grants were provisioned by QL-330.

## Safe operator procedure editing — intended future behaviour

This QL-330 interface allows **local draft-only** procedure version revisions. Any future server-backed editor must require authenticated master identity, a scoped role, a signed version digest, an append-only actor audit and independent authorization before changing an active procedure.

The three templates are (1) shell enrollment and read-only TEST, (2) child-portal event tracking and (3) management reporting. Operators may propose a new version with additional review and performance checkpoints; they must not delete source proof, independent owner/source approval, restricted managed-secret resolution, signed TEST GET, receipt verification, denial test or fail-closed rollback steps.

A configuration change is never permission to override an owner rejection or connect to a different tenant. A master identity is not an automatic customer-tenant data reader.

## Autonomous state machine — after bootstrap only

1. DISCOVER: resolve pinned public source ID, exact host and allowed signed contract path. No customer/secret access.
2. VERIFY ISSUER: independently verify original source-signed Proof-B and custody; otherwise HOLD.
3. APPROVE: verify source-owner and exact operator TEST permission, signed scope and tenant grants; otherwise HOLD.
4. RESOLVE KEY: authenticated server resolves limited managed-vault/KMS key *handle*, without returning value to browser or report.
5. READ-ONLY TEST: use existing AI Data Platform gateway for signed nonproduction health and capabilities, exact shell and child scope, nonce/time/replay/TLS verification.
6. RECEIPT: source- and broker-signed evidence, least privilege, schema compatibility and negative failure conditions; reject 401/403/404/409/429/5xx/timeout/offline as appropriate.
7. QUARANTINE/RETRY: fail closed; bounded safe retry only for approved idempotent reads. Never auto-switch to a different company or campground.
8. OWNER REVIEW: present immutable evidence and rollback plan. Consequential live activation, source writes, sends and private relay require separate approval.
9. MONITOR: when implemented, collect authorized source-health SLAs, client-portal events, report freshness, consent and scoped denial/alert audit.

No real calls, keys, peer registrations, database migrations or source signatures are created by this QL-330 software build.

## Child/shell model

- Yard Workers connects as **the YW platform shell**, never an individual landscaping business. Its existing public health/capabilities respond HOLD, not authenticated tenant permission.
- iCamp connects as **the iCamp SaaS shell**, never Camp Rosevear or any other specific campground. Its existing endpoint requires signed nonproduction scope.
- Rosie Dazzlers and Devil n Dove are owned-business implementations whose future multi-child shells require migration, child RBAC and isolation tests before other auto detailers or makers share logic.
- AI Data Platform is a supporting *broker*, and Rosevear AI Hub remains local/private, relay OFF.
- Comms Hub is a service, not the master identity provider. No cross-database master queries or unaudited data joins.

## Client portal and reporting expansion

Event types: portal sign-in, child-visible booking/job status, consented client message request, support case, report viewed. Accept only signed source events with shell+child authorization, purpose, retention and consent references. Store minimal event metadata and hashes, not message bodies or general PII.

Report designs: connection status/health; portal engagement; booking/job aggregates; communications consent and receipt statistics; financial performance by approved aggregation; security denials and audit. Each requires source freshness, lineage, explicit per-report grants and retention, and zero data until enabled by a real trusted source.

## Implementation milestones not covered by QL-330

1. Choose authoritative Master DB/project and independently authenticated master service.
2. Configure managed vault/KMS and one-time legitimate source-owner trust bootstrap.
3. Review/adopt versioned SQL migration and narrow service roles with database tests.
4. Implement actual server API for procedure revisions, safe connection sequencing, credential rotation, audit, reporting and read-only portal events.
5. Reconcile legacy source IDs and signed Integration v1 bytes without silent rewrite.
6. Commission one permitted nonproduction shell at a time with authentic original evidence and exact owner approval.
7. Perform physical-device, privacy and end-to-end acceptance before expanding to production, outbound messages, writes or children.

**References:** [Source of Truth v2](ROSEVEAR_SOURCE_OF_TRUTH_V2_2026-11-03.md), [Supabase Vault](https://supabase.com/docs/guides/database/vault), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Cloudflare Secrets Store](https://developers.cloudflare.com/workers/configuration/secrets/), [AI Data Platform signed gateway](https://github.com/RosevearCreations/ai-data-platform/blob/main/apps/web/lib/integration-v1-gateway.ts).
