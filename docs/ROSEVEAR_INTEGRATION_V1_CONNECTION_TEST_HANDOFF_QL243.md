# Rosevear Integration Contract v1 — six-app secure connection-testing handoff (QL-243)

**Pass this entire Markdown document to the other six GitHub applications.** Date: 2026-10-27 (Eastern).

We are moving from the agreed integration architecture to **nonproduction connection testing**. This document specifies work to implement, not actual credentials, automatic owner authorization, or a declaration that external apps are connected. **AI Data Platform remains our sole gateway; no application ever reads another app's database directly.** Comms Hub remains `DISCONNECTED`, with all 12 QL-181 real communications gates held.

## 1. Exactly who connects

| Application | `source_system` | Scope of first nonproduction test | Required isolation |
| --- | --- | --- | --- |
| **AI Data Platform** | `ai-data-platform` | Central authenticated broker, key registry and durable audit ledger | One key per source/business/tenant/environment; deny unregistered operations |
| **Devil n Dove** | `devilndove` | **First candidate**: read-only health, capabilities, product/listing references | No Etsy, media, inventory, order or customer writes |
| **Rosie Dazzlers** | `rosiedazzlers` | Authenticated health/capabilities; later quote/booking IDs | No payment, gift resend, booking change or customer SMS |
| **Yard Workers / PMS** | `yw` | Authenticated health/capabilities; later job ID/status | Isolate company tenant and enabled module; deny HR/payroll |
| **iCamp** | `icamp` | Authenticated health/capabilities; later site/reservation IDs | Isolate each campground; deny guest PII, reservation or gate changes |
| **Rosevear AI Hub** | `rosevear-ai-hub` | Restricted local device/service health | Private trusted connectivity only; never expose camera streams, vault, devices or automations |

Rosevear Comms Hub (`rosevear-comms-hub`) is an additional gateway consumer and holder of the QL-243 test harness, **not** a seventh recipient of this handoff. No browser-based live connection is enabled. For the first candidate, `business_id = "devilndove"`, `tenant_id = null`, `environment = "nonproduction"`; only `read_product_reference` and `read_listing_reference` are permitted. YW company and iCamp campground tenant IDs are issued by their own sources, never inferred or combined.

## 2. Required server endpoints

Implement these routes on **nonproduction servers**, with mandatory backend identity authentication:

1. `GET /api/integration/v1/health` — minimal signed application ID, contract version, environment, tenant and `HOLD` status, **no personal data**.
2. `GET /api/integration/v1/capabilities` — minimal signed, strict read-only capability allowlist for **the authenticated caller and selected tenant**. Advertising a capability does not enable any operation.
3. **AI Data Platform only:** `GET /api/integration/v1/audit/receipts/{receipt_id}` — retrieve the *already persisted* nonproduction signed gateway audit by exact ID. QL-243 reads twice, each time with a separate authenticated nonce. Independent datastore/restart inspection is needed to prove actual durability.

No `POST /events`, `POST /commands`, payment, Etsy write, telephony, phone/SMS, customer data, reservation change, job dispatch or local automation route is authorized in this phase. Unknown or mutating requests must be rejected with an auditable denial.

## 3. Exact QL-243 authenticated GET format

AI Data Platform registers a **unique 256-bit random HMAC-SHA256 secret**, key ID and allowlist for the **Comms Hub → gateway / Devil n Dove / nonproduction / GET** test. Each of the other five sources gets a *different* credential and registry entry. **Only provision secrets through an approved server-side secret manager or secure channel. Never place keys in a webpage, GitHub, a Markdown attachment, CLI arguments, logs or sample fixtures.**

Example required headers (substitute real test nonce/key ID/timestamp, never a real secret):

```text
Accept: application/json
X-Rosevear-Contract: rosevear.integration.v1
X-Rosevear-Environment: nonproduction
X-Rosevear-Source: rosevear-comms-hub
X-Rosevear-Destination: ai-data-platform
X-Rosevear-Business: devilndove
X-Rosevear-Tenant: -
X-Rosevear-Key-Id: np-devilndove-current
X-Rosevear-Timestamp: <Unix epoch milliseconds>
X-Rosevear-Nonce: np-<32 lowercase random hex characters>
X-Rosevear-Signature: <HMAC-SHA256 base64url, no padding>
```

Canonical request **UTF-8 bytes** are exactly these twelve lines separated by `\n` without a trailing newline:

```text
rosevear.integration.v1
GET
<exact requested /api/integration/v1/... path, no query>
<Unix epoch milliseconds>
<X-Rosevear-Nonce>
rosevear-comms-hub
ai-data-platform
devilndove
-
nonproduction
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
<X-Rosevear-Key-Id>
```

The 64-hex line is SHA-256 of an empty body, because **GET has no body**. Signature is `base64url(HMAC_SHA256(secret_32_bytes, canonical_UTF8))`, without padding. The receiving server must check registered caller+destination+business+tenant+environment+method+path, recompute and constant-time compare the signature, enforce ±300-second freshness and atomic durable replay rejection keyed by issuer/business/tenant/key/nonce. Check revoked keys and module/capability scopes server-side; audit every denial and success. No query strings, redirects, write routes, cross-business routing or fallback to unauthenticated access. Use TLS validation, egress/DNS allowlisting, rate limits and short timeouts. Hostname validation alone cannot prevent every DNS-rebinding risk.

The gateway returns **Ed25519-signed** health/capabilities receipts in the exact canonical format from `scripts/ql240-nonproduction-receipt-verifier.mjs` with `connection_status: "HOLD"`; its audit uses `scripts/ql242-gateway-audit-owner-rehearsal.mjs`. The private signing key remains only on the gateway server. The client pins the **public SPKI SHA-256 fingerprint** through a *separate trusted channel*. QL-241's earlier unauthenticated GET should continue to fail on an authenticated gateway—do not weaken the gateway to make an old test pass.

## 4. Independent owner identity witness (not owner approval)

QL-243 also accepts a witness-signed, time-bounded public evidence record binding the **owner public signing key** to an independently verified challenge. An identity witness must be genuinely distinct from the gateway and owner signing keys and separately vetted; a signer validating its own identity is not independent attestation.

Use the exact `QL243_IDENTITY_KEYS` ordering and `ql243CanonicalIdentity` in `scripts/ql243-secure-gateway-connection.mjs`. Illustrative **payload**:

```json
{
  "schema_version": "rosevear.integration.v1",
  "issuer": "rosevear-independent-identity-witness",
  "attestation_id": "np-identity-attestation-001",
  "identity_ref": "np-owner-ref-001",
  "method": "separate_authenticated_channel_challenge",
  "business_id": "devilndove",
  "tenant_id": null,
  "environment": "nonproduction",
  "owner_key_fingerprint_sha256": "<64 lowercase hex public SPKI fingerprint>",
  "gateway_audit_id": "np-devilndove-audit-001",
  "health_receipt_id": "np-devilndove-health-001",
  "capabilities_receipt_id": "np-devilndove-caps-001",
  "source_revision": "<actual 40-character source commit SHA>",
  "scope": ["read_product_reference", "read_listing_reference"],
  "witnessed_at": 1790000000000,
  "expires_at": 1790000300000
}
```

The separate witness signs the **canonical payload** with its own Ed25519 key and returns an envelope `{"payload": {...}, "signature": "<base64url detached signature>"}` plus public SPKI PEM. Independently acquire **three distinct** public-key SPKI SHA-256 pins: gateway, owner and witness, each verified via a separate trusted channel. Never put names, photo IDs, addresses, passwords, OTPs, customer records, credentials, camera/vault records or live owner consent into the packet. Signature verification alone does **not** prove witness independence, true owner identity, immutable audit storage or permission to start a pilot.

## 5. Paste into each application's implementation request

> Please implement **Rosevear Integration Contract v1 QL-243 secure connection testing**. AI Data Platform is the **sole** gateway. Add server-only authenticated `GET /health` and `GET /capabilities` under `/api/integration/v1/`, strict per-app/environment/business/tenant HMAC identity, atomic nonce/replay denial, short request freshness, read-only capability allowlists, signed nonproduction HELD receipts and durable audit records. Implement wrong-business/tenant, revoked/rotated key, expired timestamp, replay, wrong method, changed response, missing scope and prohibited write/dispatch **negative tests**. Preserve the local source of truth. Do **not** connect live customer records, enable automatic messages, grant commands, share database access or put a secret into client code. Return your source commit, green CI run, key ID (never secret), health/capability receipt IDs, gateway audit ID, separately verified public-key fingerprints, denial tests and unresolved blockers. Stay `HOLD` pending a separately authenticated owner read-only pilot decision.

Specific additions:

1. **AI Data Platform:** operate registry and three authenticated GET endpoints. Persist audit receipts atomically, show an independent verifier actual stored record after restart/redeploy, rotate/revoke a nonprod key, demonstrate atomic nonce dedupe. Deny any write from this test.
2. **Devil n Dove:** later expose only product `id`/`SKU`/`slug`/existing Etsy listing ID/status as read-only reference, including Product #53 for synthetic review. Deny Etsy create/update, media uploads, stock mutation, orders and contacts.
3. **Rosie Dazzlers:** prepare signed quote/booking reference metadata only; never send deposit links, gift certificate resends or appointment SMS.
4. **Yard Workers:** company-scoped service/job IDs, explicitly enabled module only; deny cross-company HR, payroll and dispatch.
5. **iCamp:** campground-scoped reservation/site reference; deny foreign campground, guest information and gate control.
6. **Rosevear AI Hub:** private health-only service reference; deny camera/vault/automation access and smart-device actuation.

## 6. What each of the six apps must return

Send a **sanitized**, independently reviewable report (never keys, tokens, customer records or full private API responses):

```text
Application and source_system:
Nonproduction source repository / exact 40-character commit SHA / green CI link:
Nonproduction HTTPS origin, method and allowed exact paths:
Key ID and registry entry reference (NOT shared secret):
Business ID, exact tenant ID, enabled module/capabilities:
Health signed receipt ID, capabilities signed receipt ID:
Gateway public SPKI SHA-256 fingerprint and separate trusted verification channel:
Durable gateway audit ID and independent datastore/restart record evidence:
Owner identity witness attestation ID, witness public-key pin verification evidence:
Negative tests: stale time, replay, revoked key, rotation, wrong company/tenant,
  disallowed module, method/write/dispatch, signature/source tampering:
Separate reviewer and rollback/revoke outcome:
Owner pilot authorization: NOT GIVEN
Connection state: DISCONNECTED / HOLD
Open blockers:
```

Fingerprints copied from the same applicant's packet are **not** independent trust. Ask for a separately verified channel. If a service still lacks these endpoints, return `NOT IMPLEMENTED` rather than inventing receipts.

## 7. Operator-safe connection test: offline first, then 4 signed GETs

Use the QL-243 harness *only after* a real nonproduction gateway is available, an owner/test operator consents to **nonproduction GET testing**, and a server-only key is provisioned to a trusted test machine. Do not use these commands in an untrusted fork or browser.

Prepare an untracked **public** JSON bundle with exact keys `ql242` (QL-242 signed packet) and `identity` (`witnessPublicKeyPem` and `envelope`), as well as an untracked non-secret config with exactly: `company`, `tenantId`, `origin`, `keyId`, `healthReceiptId`, `capabilitiesReceiptId`, `gatewayAuditId`, `sourceRevision`. Set `company` to `devilndove` and `tenantId` to `null` initially. Actual signing keys are **never** in those files. The three public-key pins are obtained out of band.

Offline signature-only test (zero external requests):

```sh
node scripts/ql243-test-connection.mjs --bundle ./local-public-evidence.json --gateway-pin-sha256 <out-of-band-gateway-public-SPKI-SHA256> --owner-pin-sha256 <out-of-band-owner-public-SPKI-SHA256> --witness-pin-sha256 <out-of-band-witness-public-SPKI-SHA256>
```

For a **separately authorized** nonproduction connectivity test, first configure `ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64` securely **in the server/test-runner environment** (base64 of 32 random bytes; do not echo it in shell history or CI logs). Then:

```sh
node scripts/ql243-test-connection.mjs --bundle ./local-public-evidence.json --connection-config ./local-nonsecret-connection.json --gateway-pin-sha256 <out-of-band-gateway-public-SPKI-SHA256> --owner-pin-sha256 <out-of-band-owner-public-SPKI-SHA256> --witness-pin-sha256 <out-of-band-witness-public-SPKI-SHA256> --allow-authenticated-nonproduction-gets
```

This performs exactly **four** signed HTTPS GETs: health, capabilities, audit receipt, the same audit receipt again with a fresh nonce. It rejects production, redirect, wrong credential/tenant, stale/replayed signature, changed audit response and extra fields. It yields a sanitized `HOLD` report; it cannot prove a durable backend simply by reading twice. Check storage/negative test traces independently. Paste **only the sanitized report** into the Comms Hub QL-243 page for local reference matching (browser cannot independently verify source). **No real owner authorization, live messaging or connector activation occurs.**

## 8. Release decision / blocker matrix

| Gate | Pass evidence | Current assumption |
| --- | --- | --- |
| Six app registrations | Exact individual source/tenant/environments and scoped keys | Unverified / HOLD |
| Signed auth GETs | Two valid health/caps receipts, replay/tenant/rotation denials | Unverified / HOLD |
| Audit persistence | Same signed record from real server, **independent datastore and restart verification** | Unverified / HOLD |
| Owner identity | Independent trusted witness key, real-world challenge and key ownership check | Unverified / HOLD |
| Owner read-only scope | New, explicit, separately authenticated owner decision for exact nonproduction scope | Not authorized / HOLD |
| Communications pilot | Twelve QL-181 prerequisites independently verified | 12/12 still HELD |

**Expected answer from every app now:** “Our nonproduction connection-test scaffolding is ready (or specify which endpoints are missing), here are real source/CI/receipt/negative-test IDs, but production writes and the owner pilot remain held.” We will move forward with **AI Data Platform ↔ Devil n Dove** first, then review the other apps one by one.

**Next expected Comms Hub build: QL-244 — Independently Witnessed Nonproduction Handshake Acceptance, Per-App Credential Exchange Review & Conditional Read-Only Pilot Authorization Decision.**
