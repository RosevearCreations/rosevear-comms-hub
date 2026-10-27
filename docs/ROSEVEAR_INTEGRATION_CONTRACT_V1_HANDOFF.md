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
