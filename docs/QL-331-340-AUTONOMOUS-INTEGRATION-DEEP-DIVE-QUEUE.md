# Rosevear Suite — QL-331–340 Autonomous Deep-Integration Roadmap

**Created:** 2026-11-03 (America/Toronto) · **Updated:** QL-332 code/database custody metadata GREEN (managed keys and workload remain HOLD), **8 PLANNED remaining**, **0/6 source connections**. No future numbered build auto-started.

**QL-331 evidence:** [release receipt](build-records/QL-331_MASTER_AUTH_SHELL_REGISTRY_RLS.md), [owner bootstrap guide](QL-331-MASTER-IDENTITY-AND-SHELL-RLS.md), [Source of Truth v3](ROSEVEAR_SOURCE_OF_TRUTH_V3_QL331.md). No genuine owner Auth user enrolled.

**QL-332 evidence:** [actual Supabase migration, private rotation acceptance, pending real managed trust](build-records/QL-332_MANAGED_CUSTODY_ROTATION_DB_AND_RELEASE.md), [bootstrap and recovery guide](QL-332-MANAGED-CUSTODY-BOOTSTRAP-ROTATION.md). Five FORCE RLS custody tables are installed and empty; all external keys and live source handshakes are HOLD. QL-333 public discovery implementation is recorded in [the six-repo contract handoff](build-records/QL-333_SIX_SOURCE_MANIFEST_DISCOVERY.md); original external signatures and live protected source connections remain HOLD.

**Previous batch:** QL-311–330 = **20/20 Production GREEN for disabled-preview software**, final main receipt `e6d6714cbdc7359bf94a60352b4f769f21011174`.
**Present external reality:** 0/6 verified active source connections; all `DISCONNECTED / HOLD`, Windows AI Hub relay OFF, ACK UNDER_REVIEW/PARKED_FOR_LATER. QL-332's narrow metadata schema is applied, but master SSO, private broker runtime, original source-signed trust, actual managed key custody and the much broader QL-330 proposal are **not deployed**.

This is an implementation queue **authorized for roadmap creation**, not a blanket authorization to migrate external databases, create privileged keys, alter peer permissions, connect to private Windows devices, send real communications, sign on anyone's behalf, or start all 10 code builds automatically. Begin a build only upon a scoped owner instruction (or an explicit future automation authorization). Do not report a functional connection from repo access, READY hosting, seeded data, fixture proofs or a UI screenshot.

## Non-negotiable topology

**Rosevear Master (future authenticated control plane)** → **AI Data Platform (verified broker)** → **four business application shells**:
- **Yard Workers** shell `yw` / source app-id `yard-workers`; independent landscaping companies (including Rosevear Landscaping) are children, NEVER connector identities.
- **iCamp** shell `icamp`; campgrounds (including Camp Rosevear) are child tenants, NEVER connector identities.
- **Auto Detailing shell** using Rosie Dazzlers logic; Rosie is the first owned child and future detailers must be tenant-isolated. Existing Rosie site is NOT YET a provisioned multi-child shell.
- **Maker Commerce shell** using Devil n Dove logic; Devil n Dove is the first owned child, future makers tenant-isolated. Existing site is NOT YET a provisioned multi-child shell.

**AI Data Platform** is the integration broker (one supporting source). **Rosevear AI Hub** is the second supporting source, a private Windows/local system (relay OFF). **Comms Hub** is a shared operator/communications service, not the identity provider, customer tenant or substitute for the broker. Six source roles = four shells + two supports. The seventh repository is Comms Hub.

## Universal architecture / database rule

Connection identity, nonsecret endpoint policy, contract versions, approval state, procedure version, schedule, retry bounds, consent, portal event schemas, reporting templates, data freshness and tenant routing should be **stored in protected database tables and managed through an audited master interface**. Do NOT require a new manually copied environment variable for each future child/tenant. Managed-vault/KMS **handles** and key versions can be stored in tables; the **actual private key, credential and master decryption key must never be ordinary editable database values, public VITE_ variables, GitHub files, browser state or reports**.

A trusted server runtime/workload identity still needs a legitimate **one-time bootstrap** with the source issuer and independently controlled vault/KMS. Afterwards safe scoped discovery, contract validation, limited retry, key rotation, health monitoring, procedure upgrades and alerts can be autonomous, subject to already-granted permissions. No code agent may manufacture source-owner approval, independent Proof-B signatures, tenant consent or production-write authorization.

## State and release vocabulary

| Label | Meaning | What it does not mean |
| --- | --- | --- |
| PLANNED | Design and acceptance criteria defined; no code delivered | Not production ready |
| CODE GREEN | Source PR merged to dev/main; exact-main CI and Cloudflare verified | Not authenticated with peers |
| DISCOVERY VERIFIED | Nonsecret manifest/source commit/issuer pinned | Not permission to private GET |
| NONPROD CONNECTED | Source-owner-approved real signed read-only handshake, independently verified both ends | Not live customer/write/sending authority |
| PROD CONNECTED | Separate explicit production release, least privilege, rollback, audit and owner approval; source-side proof | Not universal access to child tenants |
| HOLD / NO-GO | A missing external prerequisite, revoked key, failed scope or source error | Do not silently retry privileged actions |

Every build must publish exact source commits per modified repository, narrow focused/full tests, security/tenancy negative tests, migration dry-run + rollback plan (where applicable), audit/signed receipt verification, CI, and **real** origin checks rather than using a seeded local fixture as external evidence. For Comms Hub, exact main Cloudflare/Pages/Supabase/app CI and live JS/CSS SHA256 are still required. Independently report source-handshake proof and actual connection status per shell. Never count all six CONNECTED unless **six authentic connections** each have real scoped end-to-end receipts.

---

## QL-331 — Authenticated Master Control Plane, Shell Registry & Tenant Entitlements

**Goal:** Replace UI-only master/source maps with an actual owner-authenticated backend authority and private registry.

**Implementation across sources:** Select and record the authoritative master DB/project and identity boundary; build a server-only master login/role and MFA policy, owner/admin/security-auditor/shell-operator roles, session revocation and audit. Review the QL-330 PostgreSQL **proposal**, create only a separately approved, reversible nonproduction migration, and expose strictly authenticated, rate-limited registry reads. Model master → shell → child membership with source-owned child keys and compound foreign keys; never treat child display names as credentials. Data model includes shells, supporting systems, child_tenants, master_membership, delegated_grants, audit_receipts.

**Autonomy:** Newly discovered nonsecret source manifests may create **pending** registry drafts; no tenant or privilege is granted automatically.

**Pass/NO-GO:** A real authenticated master role can read permitted metadata; an anonymous or wrong-master request is 401/403; cross-shell child lookups, missing child membership, expired/revoked sessions and replay are denied in direct database/API tests. Source child data remains inaccessible. No deployment until migrations, rollback and owner-admin recovery are reviewed. **Do not silently choose one of the existing Supabase projects as the master.**

**Dependencies:** QL-330 completed. **Evidence:** nonproduction migration log, RLS/DB integration tests, signed session audit, owner-selected project decision.

## QL-332 — Managed Vault/KMS, Peer Identity Bootstrap & Automated Rotation

**Goal:** Provide centrally managed, authenticated encryption/key custody with no per-child manual environment-variable sprawl.

**Implementation:** Establish actual server/workload identity and the approved key manager (e.g., independently secured KMS or a carefully reviewed Supabase Vault pattern). Store only opaque key handles, version, purpose, owner shell and revocation/rotation status in DB. Integrate source-owned public issuer keys and identity pinning; create a secure bootstrap ceremony for source custodian keys and signed issuer Proof-B. Support scoped key access only from the private broker, automated rotation windows, dual-key transition, recovery and emergency revocation.

**Autonomy:** After legitimate enrollment and grant, check key expiry, rotate with overlap, verify both signing sides, retain immutable rotation receipts and freeze on unknown/expired keys. Automatic key renewal must never add permissions.

**Pass/NO-GO:** Raw secret scan = zero plaintext in repo, browser, logs, exports and ordinary metadata rows. Test failed KMS, revoked key, wrong shell, swapped issuer, concurrent rotation, replay and expired signatures. Demonstrate nonproduction encrypt/decrypt/sign and key rotation through real selected managed service; otherwise status **KEY CUSTODY HOLD**. Never auto-create a fake custodian signature.

**Dependencies:** QL-331; approved vault/project and owner/source key authority.

## QL-333 — Six-Source Contract Discovery, Signed Manifest Pinning & Identity Compatibility

**Goal:** Make source integration versioning discoverable and safe without manual code/env edits for each child.

**Implementation:** Review all seven GitHub repos and the existing source-owned health/capabilities contracts. Introduce versioned signed, **nonsecret** manifest schemas and server-only adapter registry for four business shells plus AI Data Platform and AI Hub. Explicitly reconcile broker registry `yw` vs source app-id `yard-workers`, iCamp shell vs campground tenant scope, and Rosie/Devil owned-business→future shell identities. Pin issuer, audience, allowed HTTPS origin/path, contract version, source revision, requested minimal scope and normal failure behavior. Do not silently rewrite signed v1 payloads; add a negotiated backward-compatible mapping.

**Autonomy:** Periodic public manifest discovery, schema comparison, version drift reports and automatic compatible adapter proposal; incompatible major changes remain HOLD until reviewed.

**Pass/NO-GO:** Six manifests mapped correctly to shell/support roles; wrong issuer, wrong tenant, injected origin, missing/extra privileged field, schema regression, 404/409/429/5xx and replay fail closed. No redirects to unpinned hosts, browser secrets or customer data.

**Dependencies:** QL-331 and signed identity rules of QL-332; nonsecret discovery can run without key authority.

## QL-334 — Database-Driven Procedure Engine, Safe Workflow Scheduler & Approval Ledger

**Goal:** Convert QL-330's local version designer into actual **audited master-controlled database procedures**.

**Implementation:** Add private authenticated CRUD for versioned DRAFT/REVIEWED/APPROVED/ACTIVE/REVOKED procedures with optimistic concurrency, signatures/digests, author/reviewer separation and append-only evidence. Implement a private scheduler/state machine for DISCOVER → VERIFY SOURCE → VERIFY OWNER → RESOLVE VAULT HANDLE → READONLY TEST → VERIFY RECEIPT → MONITOR / HOLD. Add per-shell queue, idempotency key, retries/backoff, circuit breaker, rate limit, dead-letter queue, resumability and cancel/rollback. Changes to mandatory proof, trust, grant, recipient and send policy require reviewed code/security migration rather than runtime editing.

**Autonomy:** Run routine approved GET checks, retry within caps, collect signed receipts, pause on errors and prepare owner review packets without operator copy/paste. Every consequential permission or live activation still needs explicit authority.

**Pass/NO-GO:** Simulate 401/403/404/409/429, 5xx, timeout, offline, wrong shell/child, missing Proof-B, expired key, duplicate receipt and replay. Verify no send, write, cross-tenant fallback, or privilege escalation on any failure; verify revision rollback and incident trace.

**Dependencies:** QL-331–333. **Do not activate external peers merely because the engine is deployed.**

## QL-335 — YW & iCamp Shell-Level Signed Nonproduction Handshakes

**Goal:** First actual independent read-only connectivity for the two existing SaaS shells.

**Implementation:** Implement exact master→AI Data Platform→YW platform shell and iCamp platform shell adapters; source-side server-only authentication and signed GET health/capabilities with the minimum required audience/issuer. YW `yw` / `yard-workers` identity map must be explicit; iCamp must not require a specific campground to identify the shell, while any requested child data must have a separately source-owned child grant. Install approved nonproduction key handles only after independent source-owner and owner TEST decisions.

**Autonomy:** Once each individually approved, run recurring monitored heartbeat, expiry checks, version negotiation and bounded recovery; quarantine a failed source without affecting the other.

**Pass/NO-GO:** Independent source/broker signatures and exact both-end receipt match, latency/freshness recorded, true nonproduction origin pinned, negative child-crossing tests. Reject Camp Rosevear or Rosevear Landscaping as connector issuer. If source-owned authorization is absent, ship code GREEN with each connection honestly HOLD.

**Dependencies:** QL-331–334 and each source's actual grants.

## QL-336 — Rosie Dazzlers & Devil n Dove Reusable Child-Shell Migration / Connections

**Goal:** Evolve the owned-company applications into reusable shell-level platforms for many auto-detailers and maker businesses.

**Implementation:** Design and implement a backwards-compatible shell owner/child membership model and a safe migration plan preserving Rosie Dazzlers and Devil n Dove as **first children**. Refactor source-bound identity, product/booking/customer/asset/service-account scoping (including Etsy, Stripe, media and fulfilment where applicable). Add database RLS, tenant-bound storage and API tests, isolated branding/configuration and child-safe gateway response shapes. Then create source-owned signed read-only shell manifest/health/capabilities through the broker.

**Autonomy:** With reviewed source-side permissions, enroll future children as pending records and generate per-child config, branding and checklist from DB definitions; never publish or share live child records automatically.

**Pass/NO-GO:** Cross-business database, API, file, secret, receipt and export denial tests; legacy owned-business behaviour preserved; independently verified signed shell GET for each application only after owner authorization. No automatic live tenancy migration or production provider activation.

**Dependencies:** QL-331–335, source-specific database approvals and original current data backups.

## QL-337 — AI Data Platform Broker, Comms Hub Event Contracts & Exactly-Once Effects

**Goal:** Make AI Data Platform the authenticated mediation layer for the entire suite and Comms Hub a reliable scoped consumer.

**Implementation:** Expand the signed broker with allowlisted source profiles, key handle resolver, capability routing, source receipt validation, schema registry and connection lifecycle events. Provide Comms inbound event envelopes for case/task handoff and scoped audit; enforce origin, audience, shell/child, consent, idempotency and replay protection. Guarantee **idempotent effects** under at-least-once delivery (do not falsely promise literal exactly-once transport). Add dead-letter replay tooling, trace IDs and operator evidence reconciliation.

**Autonomy:** Reconcile source health, ingest only authorized event summaries, resume approved failed deliveries, monitor backpressure and alert on drift; no auto-send of phone/SMS or customer messages.

**Pass/NO-GO:** True broker/Comms nonproduction signed receipt continuity; source-level 401/403, wrong child, stale nonce, wrong audience, duplicate event and rollback tests. No bridge from an unverified source merely because a development fixture passes.

**Dependencies:** QL-331–336 for source onboarding, with independent broker authorization. This is supporting application **#5**.

## QL-338 — Rosevear AI Hub Secure Local Relay, Device Proof & Offline Recovery

**Goal:** Integrate the Windows local/private support system without exposing its internal services publicly.

**Implementation:** Inventory Windows startup dependencies and real reachable endpoints with **supervised owner-device evidence**. Design a private outbound relay (Tailscale/private network with authenticated mTLS or equivalent, narrow service identity and certificate rotation), allowlisted master broker requests, deny all unapproved camera/home automation actions, and local encrypted queue/heartbeat with expiry. Ensure automatic rejoin, circuit breakers, offline and power-restart audit; private relay remains OFF until authorized.

**Autonomy:** Once independently approved and installed, reconcile local service health, trigger safe reconnection/renewal and owner alerts; no automatic Windows reboot, device control, recording, camera streaming or home-access activation.

**Pass/NO-GO:** Physical Windows owner witness of endpoint origin, authentication, TLS/cert rotation, offline queue retention, retry expiry, reboot recovery, wrong-device/shell denial and no exposed LAN port. Without real owner observation, publish only design/test code and keep RELAY OFF. This is supporting application **#6**.

**Dependencies:** QL-331–334, QL-337 broker and a supervised local device authorization.

## QL-339 — Unified Child-Safe Client Portal Tracking & Consent-Aware Case Journeys

**Goal:** Deliver real multi-shell client portal activity tracking without pooling the data of unrelated businesses.

**Implementation:** Implement shell/child-owned portal identity federation or explicit scoped delegation, login/session and role revocation, consent timeline, source-signed minimal event receipts, service requests, booking/job status, communication preference/opt-out and support cases. Define tenant-specific data retention and data-subject access/export/deletion gates, anonymized aggregate reporting and source provenance. Comms UI shows only authorized minimal customer context; sensitive customer records stay with owning app.

**Autonomy:** Reconcile portal activity, stale cases, owner-visible follow-ups and consent exceptions; enforce expiry, revocation and retention on an approved server-only schedule.

**Pass/NO-GO:** Cross-shell/child 403 with DB-level proof, denied export without consent, source signature and retention tests, no duplicate events, no accidental customer-wide master view, exact privacy receipts. Portal tracking stays TEST/DISCONNECTED until authentic child grants and consent exist.

**Dependencies:** QL-331–338 with at least one authentically authorized source pilot; do not fabricate live portal data.

## QL-340 — Master Reporting & SLOs, Six-Source Evidence Reconciliation, Controlled Production Handoff

**Goal:** Operational master command with source-grounded reporting, integration reliability, exception workboard, and an honest owner-accepted production readiness decision **per shell**.

**Implementation:** Deliver connection health/latency/freshness dashboards, source/issuer/tenant coverage, key expiry, failure taxonomy, signed receipt correlation, client portal funnels, booking/job case reports, communications outcomes, finance views behind explicit grants, scheduled exports, cross-device owner acceptance and incident response. Maintain per-source release gate, rollback, audit, uptime/error budget and retry policy; produce a downloadable evidence packet. Integrate monitoring/recovery with QL-334 orchestrator, never reporting a sample as a live KPI.

**Autonomy:** Scheduled permitted source heartbeats, incident escalation, drift/expired-key quarantine, bounded recovery, daily exception digests and management summaries. **Human authorization remains required** for new privileges, production enablement, consent-sensitive exports, provider sending and the private Hub relay.

**Pass/NO-GO:** For each of the six sources, record independently verified signed issuer and broker receipts, actual source scope, connection/child isolation, owner/source approval, exact production URL, real nonproduction/prod state, failure recovery and rollback; if a source still lacks authority it remains HOLD with a truthful blocker. Verify Comms main/deployment/live JS/CSS parity, secure DB migration receipts, key rotation, PII/tenant denial, signed data lineage, measured SLOs, physical device acceptance and no duplicate events. **Software GREEN is separate from 6/6 CONNECTED.**

**Dependencies:** QL-331–339; source-owner change authorization and independent acceptance before production activation.

---

## Autonomous build rules and final handoff

1. **No auto-queue or merge by merely writing this roadmap**. Each named build has implementation dependencies, code review, exact-main CI and rollout gates. The owner may explicitly authorize sequential execution and safe automated checks for known scopes; unavailable approvals block only the external activation portion.
2. Every source-repository modification must preserve its own release cadence, branch protection and owner-required production checks; Comms Hub green alone proves no other application's production deploy.
3. No raw secrets or unreviewed service-role keys in GitHub, browser, database metadata, screenshots, chat or telemetry. A DB-driven system does not remove the need for a guarded workload identity or managed vault root of trust.
4. YW and iCamp connect at **shell** level. Rosie/Devil must pass multi-child refactor before being advertised as reusable public shells. Supporting sources cannot be customer tenants.
5. Never manufacture signed proof, peer-owner consent or a successful live TEST. Prefer source-owned, independently reproducible evidence; if missing, mark **HOLD** with exact missing authority and a safe automated recheck.
6. Gate every source activation separately. A 6/6 target is a goal, not a precondition for reporting honest partial progress or a reason to bypass a source's permission system.

**Machine-readable planning metadata:** [QL-331–340 registry](QL-331-340-AUTONOMOUS-INTEGRATION-QUEUE.json). **Prior canonical context:** [Source of Truth v2](ROSEVEAR_SOURCE_OF_TRUTH_V2_2026-11-03.md), [QL-330 control-plane blueprint](ROSEVEAR_MASTER_CONNECTION_CONTROL_PLANE_V1.md), [QL-330 verified receipt](build-records/QL-330_FINAL_OWNER_CLOSEDOWN_AND_MASTER_CONNECTION_DESIGN.md).

**Next proposed build when separately authorized:** QL-331 — Authenticated Master Control Plane, Shell Registry & Tenant Entitlements. No QL-341 is specified or automatically scheduled.
