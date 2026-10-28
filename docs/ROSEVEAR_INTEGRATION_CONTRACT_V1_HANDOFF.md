# Rosevear Integration Contract v1 — instructions for every application

Date: 2026-10-27. Based on the owner-provided *Rosevear Cross-Application Connection Plan v1* (`Rosevear_API_V1.rtf`). This is an **implementation contract and rollout plan**, not a declaration that live systems are connected.

## Shared architecture and ownership

Use one hub-and-spoke gateway: **AI Data Platform = Integration Gateway / connector control plane**. Devil n Dove, Rosie Dazzlers, Yard Workers/PMS, iCamp, Rosevear Comms Hub and Rosevear AI Hub each connect **only to that gateway**. No app gets another app's database credentials, and the gateway does not become owner of other apps' records.

| Source of truth | Data it owns | Safe first integration |
| --- | --- | --- |
| Devil n Dove | Products, SKU, slug, media, stock, Etsy/Marketplace listing IDs, orders, commissions | `health`, `capabilities`, then read-only product/reference/listing relationship |
| Rosie Dazzlers | Vehicles, customers, service quotes, bookings, gift certificates, payments | `health`, `capabilities`, then read-only quote/booking reference |
| Yard Workers / PMS | Company tenants, clients, properties, service modules, estimates, jobs, crews, billing | `health`, `capabilities`, then tenant- and module-scoped job reference |
| iCamp | Campground tenants, sites, reservations, guests, passes, payments | `health`, `capabilities`, then campground-scoped reservation reference |
| Rosevear Comms Hub | Conversations, channel consent, communication assignment, handoff status | Reference-only conversation context and approval-held handoff drafts |
| Rosevear AI Hub | Home devices, local services, cameras, automations | Narrow device/service health only; never general customer records |
| AI Data Platform | Integration registry, routing policy, event ledger, receipts | Routes and audits; does not edit business databases directly |

## v1 server endpoints (all apps)

1. `GET /api/integration/v1/health` — authentication-required server response with application ID, version, contract version, environment and connection state; **no customer data**.
2. `GET /api/integration/v1/capabilities` — authentication-required read-only allowlist of capabilities for the calling application, business, tenant and environment. Describing a capability does **not** enable it.
3. `POST /api/integration/v1/events` — **future phase**, signed envelope, gateway-only routing, time/tenant/permission/replay checks, auditable hold/reject receipts; do not enable on this build.
4. `POST /api/integration/v1/commands` — **blocked future phase**, explicit command allowlist and owner policy; accepted/rejected/owner-approval-required receipt, with no side effect until approved.

Use shared contract identifier `rosevear.integration.v1`; each application's health response identifies its own version and environment. Connection states: `DISCONNECTED`, `CONFIGURED`, `TESTING`, `CONNECTED`, `DEGRADED`, `HOLD`, `ERROR`, `REVOKED`. A success banner without the underlying state, checks and timestamp is inadequate.

## Standard event envelope (future — illustration, not a live event)

```json
{
  "event_id": "demo-event-001",
  "event_type": "product.updated",
  "schema_version": "rosevear.integration.v1",
  "source_system": "devilndove",
  "destination_system": "ai-data-platform",
  "business_id": "devilndove",
  "tenant_id": null,
  "entity_type": "product",
  "entity_id": "demo-product-53",
  "occurred_at": "2026-10-27T12:00:00Z",
  "trace_id": "demo-trace-001",
  "idempotency_key": "demo-once-001",
  "payload": { "reference": "demo-product-53" }
}
```

**No personal names, contact details, street addresses, message bodies, phone numbers, media blobs or credentials in the common event.** Add only approved minimal references. Keep `(source_system, source_business, source_entity_id, tenant_id)` identity; never silently merge people by matching name, email, phone or address. Link identities explicitly with an audit receipt.

## Required server security (not delivered by browser-only QL-237)

- Unique server-only credentials per app and environment; authenticated gateway-to-app identity, short-lived signed requests (initially scoped HMAC with key ID and rotation; consider workload OIDC later). Never place secrets in frontend bundles.
- Canonical raw-body signature verification, timestamp/freshness check, nonce/event replay suppression, **durably atomic** idempotency keyed by issuer + tenant + operation, and a persistent audit receipt (accepted, rejected or owner approval required).
- Enforce active business and tenant ownership, module availability, role, action and capability allowlist **at receiving server**, not merely in a UI. A YW company cannot read another YW company; one iCamp campground cannot read another.
- Per-connection HOLD, revoke/rotate, scoped retries with dead-letter inspection and manual safe replay; no unbounded retries, duplicate effects or silent cross-business relays.
- Protect logs, event payloads, receipts and retention. Record trace ID and result, never transport secrets or unnecessarily expose customer data.
- Explicit opt-in from owner for each new phase, with independently reviewed negative cross-business and cross-tenant tests.

QL-237's event validator and receipts in Comms Hub are **fictional, browser-only illustrations**; they do not verify cryptographic signatures or serve HTTP. Do not copy them as a production authentication implementation.

## Standard event families (progressive allowlists)

- Devil n Dove: `product.created`, `product.updated`, `product.media_updated`, `inventory.changed`, `listing.created`, `listing.updated`, `order.created`, `order.status_changed`, `commission.created`.
- Rosie Dazzlers: `quote.created`, `quote.accepted`, `booking.created`, `booking.rescheduled`, `booking.completed`, `payment.status_changed`, `gift_certificate.created`.
- Yard Workers: `service_request.created`, `estimate.created`, `estimate.accepted`, `job.created`, `job.assigned`, `job.status_changed`, `invoice.created`, `payment.status_changed` (always include company tenant and enabled service module).
- iCamp: `reservation.created`, `reservation.changed`, `reservation.cancelled`, `guest.arrived`, `guest.departed`, `site.status_changed`, `visitor.registered`, `work_order.created`, `payment.status_changed` (always include campground tenant).
- Comms Hub: `communication.received`, `communication.sent`, `handoff.created`, `handoff.completed`, with consent and channel classification.
- AI Hub: `device.status`, `camera.status`, `automation.status`, `notification.request`, `local_agent.status` (separate restricted permissions).

These are *names for future review*, not automatic subscription or write grants. For example, **only Devil n Dove decides whether/when its Etsy listing is updated**, not the gateway or Comms Hub.

## Instructions to paste into each application's build request

> Implement **Rosevear Integration Contract v1** with the **AI Data Platform as the sole Integration Gateway**. Add server-only `GET /api/integration/v1/health` and `/capabilities` with per-app/environment identity, owner-managed capability allowlists and no customer information. Design signed server authentication, business/tenant validation, idempotency/replay and audit receipt mechanisms; write negative cross-business/tenant, expired/replayed-signature, revoked-key and permission-denied tests. Do not share another app's DB credentials, enable commands, import actual customer records, or enable external calls/SMS. Keep existing local source of truth. Wait for AI Data Platform's owner-approved read-only gateway handshake before proceeding to real data.

### Specific asks by application

1. **AI Data Platform**: implement the Integration Registry, connection state machine, per-app server credentials/rotation, capability grants, signed identity and read-only health/capabilities broker; audit immutable receipts. No product database copied into it.
2. **Devil n Dove**: expose health and capability allowlists first, then product `id` / `SKU` / `slug` / `Etsy listing ID` / listing state as sanitized read-only reference; test Product #53 with no Etsy draft changes, media writes or new listings.
3. **Rosie Dazzlers**: expose health/capabilities, then quote/booking IDs and statuses as reference-only; preserve booking wizard and deposits without automated customer communication.
4. **Yard Workers / PMS**: expose health/capabilities, then read-only service/job references; verify per-company tenant and enabled service module in every endpoint.
5. **iCamp**: expose health/capabilities, then a reservation/site reference scoped to a specific campground; test Campground A cannot inspect Campground B.
6. **Comms Hub**: consume gateway-provided read-only references and create held, consent-aware handoff requests only. Preserve all 12 `QL-181` real-pilot holds; no provider dispatch or live message send.
7. **Rosevear AI Hub**: permit only local service/device health exposure through tightly scoped server rules. Do not give business apps direct camera feeds, passwords or automation control.

## Rollout and acceptance gates

| Phase | Required proof | Live effect |
| --- | --- | --- |
| 1. Shared v1 contract | Types, negative tests, owner-specified permissions, stable IDs | None |
| 2. Health/capabilities | Authenticated app-to-gateway handshake, tenant isolation and audit receipts verified | **No customer records** |
| 3. Read-only Devil n Dove pilot | Accurate ID/SKU/slug/Etsy-ID mapping; explicit owner read approval | No Etsy writes |
| 4. Other read-only app refs | Rosie, YW, iCamp and restricted AI Hub gateway tests | No cross-app edits |
| 5. Signed events | Source-verified event receipts, replay/tenant enforcement, dead-letter handling | No remote writes |
| 6. Commands | Per-operation owner consent, dry-run, rollback, fresh audit review | Blocked until separate approval |
| 7. Comms provider pilot | Provider contract, consent/privacy, 12 QL-181 gates, independent approval | **Not part of QL-237** |

## QL-238 readiness handoff (not an enabled connector)

The QL-238 Comms Hub screen and isolated Node-only synthetic HMAC harness now demonstrate what a **server-only** read-only handshake must deny. The gateway must insist on this sequence:

1. Independently authenticated GET /api/integration/v1/health for the exact registered application, tenant, environment and version; return HOLD until real policy checks complete.
2. Independently authenticated GET /api/integration/v1/capabilities for that same registered app/tenant after health, with **read-reference capabilities only**. Do not expose create_handoff_preview, payment, product updates, reservations or phone/SMS dispatch as an enabled operation.
3. Persist an atomic nonce/idempotency audit receipt on the **real server**; reject replay, wrong route, stale timestamp, wrong key, revoked key, changed body, wrong app, cross-business/tenant and unexpected fields.
4. Publish an independent evidence packet showing expected response, exact environment, denied negative tests, permissions, key rotation and rollback. This packet is not actual owner approval.

The current mock and Node sandbox use fabricated IDs and randomly generated test keys **only**. They are not proof that any connected app endpoint exists. Keep all actual Comms Hub connections DISCONNECTED and all twelve QL-181 live-pilot gates held until separately approved.

**Next expected Comms Hub build:** QL-239 — Integration Contract v1 Read-Only Gateway Proof Intake, Credential Rotation Dry Run & Independent Four-Company Connection Review.

## QL-239 read-only proof intake: how other teams return evidence

QL-239 adds a **manual, session-local intake** and independent HELD-review draft (details in [QL-239 acceptance note](QL-239_READ_ONLY_GATEWAY_PROOF_INTAKE_ROTATION_REVIEW_HELD.md)). Each receiving application should send back a GitHub commit/PR/Actions run URL, exact 40-character commit SHA, non-personal evidence identifier, **separate health/capabilities audit receipt IDs**, exact UTC evidence capture time, and a checklist with signed health, signed capabilities, wrong business/tenant denial, expired/replayed request denial, revoked-key denial, prohibited write/dispatch denial, new-key held GET and old-key rejection after rotation. These references **are only claims until independently retrieved and checked**. Never send keys, tokens, full customer payloads, conversation messages or actual contact data in the handoff.

QL-239's separate Node-only rehearsal uses invented keys and no network. Its browser review cannot authenticate a real application or enable a connector. Every actual Comms Hub gateway connection remains DISCONNECTED and the twelve live-pilot gates remain held. The first potential real read-only candidate is still **AI Data Platform ↔ Devil n Dove** under a separate owner decision.

**Next expected Comms Hub build after QL-239:** QL-240 — Integration Contract v1 Independently Verified Nonproduction Gateway Receipts, Tenant/Key Audit Reconciliation & Owner-Safe Read-Only Pilot Decision Gate.

## QL-240 — external nonproduction signature evidence handoff

QL-240's isolated Node verifier now demonstrates real **Ed25519 signature verification against independently supplied pinned public keys** for invented nonproduction receipts. It rejects tampering, revoked/unpinned keys, wrong business/tenant, stale or replayed receipt, unknown/write capability, direct app routes and non-held/production statuses. This does **not** prove any actual company deployed this contract or owns the test keys. See [QL-240 audit requirements](QL-240_NONPRODUCTION_RECEIPT_VERIFICATION_AND_PILOT_GATE_HELD.md).

For each application, return the exact GitHub source commit and CI run, gateway health/capabilities receipt IDs, trusted public-key ID/fingerprint via a separate verified channel, signed test receipt proof, tenant rejection tests, rotation/revocation/rollback evidence and durable gateway audit IDs. **Do not send private keys, secrets, customer information, Etsy updates, phone messages or live dispatch commands.** QL-239 input must be external, not fictional, before QL-240 can prepare a held review. All Comms Hub actual connections remain DISCONNECTED with all twelve real QL-181 pilot gates held.

**Next expected Comms Hub build after QL-240:** QL-241 — External Nonproduction Gateway Proof Retrieval, Independently Pinned Public-Key Evidence & Devil n Dove Read-Only Pilot Owner Authorization Readiness.

## QL-241 — developer-side external proof retrieval and held owner request

QL-241 adds an explicitly invoked Node-only, credential-free HTTPS `GET` retrieval path for nonproduction signed health/capabilities receipts. The operator supplies an exact gateway origin, business/tenant, public Ed25519 key, key ID and two receipt IDs in a **local, non-secret config**; a **separately obtained SHA-256 fingerprint** of that public key is mandatory. The request refuses production, mutation routes, browser execution, redirects, unexpected fields, stale/replayed receipts, unknown capabilities, foreign tenants and incorrect pins. Its result is a **sanitized HELD report** only, and does not establish key provenance or live authorization. See [QL-241 verification runbook](QL-241_EXTERNAL_NONPRODUCTION_GET_PROOF_AND_OWNER_READINESS_HELD.md).

Every other application should return: public GitHub source commit and green CI run; nonproduction AI Data Platform gateway HTTPS origin; exact held receipt IDs; non-secret Ed25519 public SPKI key and key ID; fingerprint via an **independent trusted channel**; gateway persistent audit ID and negative denial/revocation/rollback evidence. No keys that can sign, bearer tokens, real customer records, phone messages, phone/SMS provider connections or automatic production writes. If endpoints are auth-protected, Comms Hub's credential-free GET is expected to fail; do not weaken their authentication to make a demo pass. Arrange future server-only credentials and a separate owner-approved, read-only pilot instead.

The new **External GET proof & owner HOLD** operator workspace can reconcile a sanitized CLI report to QL-239/240 references, but labels the manually entered report **UNATTESTED**. It can create only a session-local Devil n Dove **owner authorization request draft**. It cannot grant owner approval or turn on any connector. All four connections remain `DISCONNECTED`, twelve QL-181 live-pilot prerequisites remain `HELD_UNVERIFIED`, and provider dispatch, calls and SMS stay disabled.

**Next expected Comms Hub build after QL-241:** **QL-242 — Independent Gateway Audit Provenance Verification, Owner-Signed Pilot Decision Receipt & Reversible Read-Only Rollout Rehearsal**. Any actual rollout must have independently obtained external evidence and a new explicit owner authorization.

## QL-242 — separately signed gateway audit and owner decision *request* (all real connections remain held)

QL-242 adds a **strictly offline dual Ed25519 signature comparison** and a session-only reversible **read-only rollout rehearsal**. AI Data Platform must provide a signed, independently retrievable nonproduction audit receipt linked to the current health/capabilities receipt IDs and source SHA. Devil n Dove must confirm an exact `read_product_reference` / `read_listing_reference` scope and no Etsy, inventory, media or customer-data writes. A separately authenticated owner must provide a **time-limited signed request to consider a rehearsal** with its own independently pinned public signing key and a rollback ID; this is **not real approval to connect**. See the [QL-242 evidence runbook](QL-242_AUDIT_PROVENANCE_OWNER_SIGNATURE_ROLLBACK_REHEARSAL_HELD.md).

The Node verifier can verify two independent signatures from caller-provided public keys, but **does not prove public-key ownership or durability of an audit log**. A self-signed evidence packet cannot constitute independent owner attestation. A matching CLI report pasted into Comms Hub is still `SIGNED_REFERENCES_CLAIMED_UNATTESTED_HELD`, and local prepare/simulate/rollback actions never modify deployment config, connect tenants, send messages or approve a pilot. All **12 QL-181 gates stay `HELD_UNVERIFIED`** and all **four company connections stay `DISCONNECTED`**.

**Next expected Comms Hub build after QL-242:** **QL-243 — Independent Owner Identity Attestation, Durable Gateway Audit Retrieval & Read-Only Pilot Release-Blocker Resolution.**

## QL-243 — six-app secure **nonproduction connection-testing** handoff

The owner reports delivering this common contract to all **six companion GitHub apps**: AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers/PMS, iCamp and Rosevear AI Hub. Share the complete [QL-243 secure connection-testing handoff](ROSEVEAR_INTEGRATION_V1_CONNECTION_TEST_HANDOFF_QL243.md) with each build conversation. It specifies server-only per-app HMAC credentials, canonical authenticated GETs, tenant isolation, Ed25519 public-key pin verification, gateway audit receipt retrieval, owner identity witness evidence, six app-specific requirements, negative tests and returned source/CI/receipt evidence. Credentials never belong in a GitHub handoff.

QL-243 implements an explicitly invoked **Node-only four-GET nonproduction probe** (health, capabilities, audit record, same audit record again) and distinct third-party identity-witness signature matching. Real endpoints, independently trusted public-key pins, an external witness and a secure server-only test key must be provisioned separately **before** a real connection test. Repeated HTTP reads do not independently prove durable audit storage, and a witness signature alone does not verify identity or grant pilot consent. The operator page can only review a **sanitized, UNATTESTED HELD** report. See the [QL-243 verification note](QL-243_OWNER_IDENTITY_AUDIT_RETRIEVAL_CONNECTION_TEST_HELD.md).

**All four business connections remain `DISCONNECTED` and all twelve QL-181 live-communications prerequisites remain `HELD_UNVERIFIED`.** No live nonproduction test has been performed without real endpoints and authorized test credentials. No cross-app writes, phone/SMS, Etsy changes, provider dispatch or actual owner approval has been enabled.

**Next expected:** **QL-244 — Independently Witnessed Nonproduction Handshake Acceptance, Per-App Credential Exchange Review & Conditional Read-Only Pilot Authorization Decision.**

## QL-244 — six independent app replies, assessor proof and conditional review only

The owner confirms the QL-243 Markdown was delivered to all six companion apps. Their *actual* source/CI responses, server-side credential exchange, independent assessor evidence and real owner permission must still be verified. Share the [new QL-244 handoff for the six apps](ROSEVEAR_INTEGRATION_V1_QL244_WITNESSED_HANDSHAKE_HANDOFF.md); it includes six per-app evidence-return checklists, four separately trusted signer fingerprints, original gateway receipt and negative-denial evidence, and exact non-secret assessor and owner **review-request** packet schemas.

QL-244 ships a strict offline two-additional-signature verifier and a session-only operator panel for credential registry metadata. Its result remains `TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD`; no signature or metadata claim is treated as actual consent, durable backend proof or a secret transfer. All companies stay `DISCONNECTED`, no real owner authorization is given, and all 12 QL-181 prerequisites remain held. See the [QL-244 acceptance note](QL-244_WITNESSED_HANDSHAKE_CREDENTIAL_REVIEW_HELD.md).

**Next expected:** **QL-245 — Verified Six-App Nonproduction Evidence Returns, Owner Decision Exception Triage & Read-Only Connection Activation Preconditions.** Actual connection activation needs separate independently verified owner approval; a green deployment alone does not unlock it.

## QL-245 — owner-provided six-app handoff reconciliation, no actual connection

The owner provided `Rosevear-Connect-V1.rtf` with implementation status from AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp and Rosevear AI Hub. All six report some or all QL-243 safeguards. **None supplied genuine, independently retrievable signed nonproduction gateway receipts, a complete six-app credential/pin registry, externally proven audit durability and distinct authenticated owner approval.** Devil n Dove explicitly says its product/listing reads remain disabled and its key has not been provisioned; AI Data Platform says no test connection is pre-registered; AI Hub endpoints remain off by default.

QL-245 now provides a [six-app signed-evidence return handoff](ROSEVEAR_INTEGRATION_V1_QL245_EVIDENCE_RETURN_HANDOFF.md), seven-signature offline public-metadata checker and operator gap-triage screen. The verifier accepts only six different app signing keys, one assessor signature, matching QL-244 source references and strict per-app/tenant/test denials. A positive report is **held cryptographic metadata**, not proof that a real authenticated test occurred or that the owner consented. See the [QL-245 software acceptance note](QL-245_SIX_APP_EVIDENCE_RETURN_TRIAGE_HELD.md).

**All four real integrations stay DISCONNECTED, with owner authorization NOT GIVEN and all twelve QL-181 communications gates held.** No external nonproduction GETs, connector activation, customer data transfer or provider messaging was performed by this build.

**Next expected:** **QL-246 — Independently Retrieved Six-App Source Proof, Trusted Pin Challenge & Owner-Safe Nonproduction Test Decision Reconciliation.**

## QL-247 — independently inspected six-repository source census and true connection blockers

The owner's latest `ROSEVEAR_QL246_SIX_APP_SOURCE_PROOF_HANDOFF(6).md` contains **five** app implementation updates and no AI Data Platform status paragraph. QL-247 separately inspected all **six actual GitHub companion repositories**, including the correct `devilndove-site` and case-sensitive `iCamp` repository slugs. At the observed main SHAs, all six required `docs/integration/ql246-source-proof.json` signed public envelopes were **missing (404)**. There is no independently provisioned six-app HMAC registry, actual signed nonproduction gateway GET, trusted public signer-pin challenge, observed durable audit or authenticated owner pilot authorization. Repository co-ownership is insufficient to establish any of these.

The [QL-247 independent source census](QL-247_SIX_APP_PUBLIC_SOURCE_CENSUS_AND_CONNECTION_BLOCKERS.md) records the exact observed revisions, one per-app exception and a bounded operator-only GitHub public GET checker. The [QL-247 six-app handoff](ROSEVEAR_QL247_SIX_APP_CONNECTION_TEST_HANDOFF.md) is ready to send to every application. The public UI's QL-247 evidence panel shows this historical snapshot and cannot fetch secrets or activate a connection. No code or approval is fabricated to fill missing evidence.

**Decision remains `DISCONNECTED / HOLD`: all four companies and all 12 QL-181 real pilot scenarios stay held.** A GREEN `main` deployment only releases the disabled-preview operator code and source inspection tools. Actual nonproduction network testing requires distinct server-side credentials, separately verified public pins, independently witnessed read-only requests and a separate, narrow test authorization. A later owner-authenticated pilot approval is a distinct decision.

## QL-248 — two-commit signed source proof handoff and offline pin reconciliation

The AI Data Platform QL-246 source-proof handoff has a self-reference problem: a file cannot normally contain the SHA of the Git commit that itself contains the file. QL-248 proposes preserving the existing signed `source_revision` as the earlier audited source/test SHA, then separately pinning the *later* proof-bearing commit SHA and exact raw JSON SHA-256 in the operator manifest. This requires explicit acceptance by AI Data Platform and the six app consumers; it has **not** been imposed as a unilateral contract change.

The [QL-248 six-app amendment handoff](ROSEVEAR_QL248_PROOF_COMMIT_AMENDMENT_HANDOFF.md) is ready to distribute. The [QL-248 independent verification note](QL-248_IMMUTABLE_PROOF_COMMIT_RECONCILIATION_AND_PIN_REVIEW_HELD.md) describes the new offline Ed25519 source-signature verifier and test coverage. A positive offline signature result still cannot establish independently sourced GitHub provenance, authentic original gateway tests, actual source-key ownership, durable audit or owner approval. **All four company connections remain DISCONNECTED; all 12 live communications prerequisites remain held.**

**Next expected Comms Hub build:** QL-249 — Six-App Immutable Proof Publication Retest, Independent GitHub Origin Attestation & Owner-Scoped Nonproduction GET Scheduling (HELD).

## QL-249 — independently refreshed GitHub source provenance and unscheduled test candidates

After QL-248's two-revision transport clarification was forwarded, the six companion applications began further builds. QL-249 independently retrieved each application's newer GitHub `main` SHA and checked the required exact QL-246 source-proof path. **All six were still missing (404)** at the observed 28 October source revisions; see the [QL-249 six-app source report](QL-249_SIX_APP_IMMUTABLE_PROOF_ORIGIN_RETEST_AND_OWNER_TEST_SCHEDULING_HELD.md). This is a point-in-time observation while the other builds continue, not a claim about their subsequent completion.

The new QL-249 bounded, public-only source retriever can, when later proofs exist, separately inspect each GitHub proof-bearing commit, signed older audited source SHA, GitHub ancestry and exact successful source-CI run. A proof's self-signature is not the independently authenticated public key pin. No real gateway or private household endpoint is contacted. All six candidate nonproduction GET test slots remain **NOT SCHEDULED** pending separate owner-scoped test authorization; live pilot authorization is a different later decision. Send the [QL-249 companion handoff](ROSEVEAR_QL249_SIX_APP_ORIGIN_RETEST_AND_OWNER_TEST_SLOT_HANDOFF.md) to all six apps.

**Decision: 0 verified gateway GETs; 0 independently authenticated pins; all four company connections DISCONNECTED; 12/12 communications pilot gates HELD.** No writes, calls, SMS or dispatch were enabled.

**Next expected Comms Hub build:** QL-250 — Independent Six-App Proof/CI Refresh, Key-Pin Custody Challenge & Owner-Approved Nonproduction GET Window Witnessing (HELD).
