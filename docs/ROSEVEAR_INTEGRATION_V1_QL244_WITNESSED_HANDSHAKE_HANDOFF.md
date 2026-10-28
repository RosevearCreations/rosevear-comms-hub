# Rosevear Integration Contract v1 — QL-244 witnessed handshake and credential review handoff

**October 27, 2026 (Eastern). Send this entire Markdown to all six other applications.**

We have reached the **nonproduction connection-testing evidence stage**, not the live-connection stage. The earlier QL-243 handoff has been distributed, but no authentic six-app responses, independently attested owner permission or credential transfers have been verified in Comms Hub. All four pilot connections remain `DISCONNECTED`; all 12 QL-181 real communications prerequisites remain `HELD_UNVERIFIED`.

**AI Data Platform remains the sole data exchange gateway.** Never connect one sibling application's database directly to another, use one shared credential across companies, or expose private credentials in GitHub, browser code, Markdown, logs or chat.

## Exactly what each of the six apps returns

| Application | Initial QL-244 nonproduction read-only task | Mandatory denial |
| --- | --- | --- |
| AI Data Platform (`ai-data-platform`) | Per-app key registry; health/capabilities/audit GET endpoints; durable audit and replay/rotation proof; independent test witness | Unregistered operations, cross-business and tenant, POST/commands |
| Devil n Dove (`devilndove`) | First candidate: health, capabilities, read-only product/listing reference IDs and exact source/CI/receipt proof | No Etsy, media, inventory, orders, customers or writes |
| Rosie Dazzlers (`rosiedazzlers`) | Scoped health/capabilities, quote/booking reference plan and registry metadata | No payments, gift resend, appointment change or SMS |
| Yard Workers (`yw`) | Per-company/per-module health/capabilities and job reference plan | No payroll/HR, cross-company lookups or dispatch |
| iCamp (`icamp`) | Per-campground health/capabilities, site/reservation reference plan | No guest PII, reservation or gate changes |
| Rosevear AI Hub (`rosevear-ai-hub`) | Private trusted-link device/service health, strictly limited | No public cameras, vault, automations or actuation |

Comms Hub is the seventh **consumer**, not a sixth source. In the first test: `business_id: devilndove`, `tenant_id: null`, `environment: nonproduction`, scopes exactly `read_product_reference` and `read_listing_reference`. YW company and iCamp campground tenant IDs must be issued by their own services.

## Strict credential and evidence requirements

1. Maintain one distinct 256-bit nonproduction HMAC key per service/business/tenant/environment/scope in an approved **server-side** secret store. Exchange through a trusted, separately authenticated secret channel only. Never place actual secrets, bearer tokens, private signing keys, customer data or owner identity records in reports, source control, packet fixtures or command-line arguments.
2. Return **non-secret key IDs** and exchange receipt reference IDs for each of the six apps, with exact source commit SHAs and green CI links. QL-244's first offline specimen permits registry metadata `NONPRODUCTION_METADATA_REVIEWED_HELD` for AI Data Platform and Devil n Dove only; the other four must say `NOT_PROVISIONED_HELD`. All six use `OWNER_APPROVAL_NOT_GIVEN_HELD`. Even a reviewed registry is **not proof of secret exchange**.
3. Server-only authenticate `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities`, plus AI Data Platform's `GET /api/integration/v1/audit/receipts/{receipt_id}`, per QL-243. Enforce exact HMAC canonical requests, TLS, timestamp skew ±300 s, atomic nonce replay rejection, method/path/business/tenant scopes, revoked-key checks and audited denial. No fallback anonymous access, redirect, writes, real telephony or customer operations.
4. A separately authorized nonproduction test runner may perform the **four QL-243 authenticated GETs**: health, capabilities, audit receipt, same audit receipt again with a fresh nonce. Browser code must perform **zero** connection requests. Independent datastore/restart inspection is still needed to prove true audit durability.
5. A **real independent assessor** must examine original traffic, source SHA/CI, audit storage, seven negative denials (`nonce_replay_denied`, `stale_request_denied`, `cross_business_denied`, `cross_tenant_denied`, `revoked_key_denied`, `write_denied`, `dispatch_denied`), key ownership and rollback/revoke evidence. A signed claim alone is not a genuine witnessed observation.
6. Independently verify **four distinct Ed25519 public SPKI SHA-256 pins** over separate trusted channels: gateway, owner, identity witness, handshake assessor. Fingerprints copied from an applicant's packet are not independently pinned trust.
7. The actual owner may sign only `REQUEST_CONDITIONAL_READ_ONLY_REVIEW` in QL-244. This means “please review a candidate” — **not** “enable it.” Pilot approval requires a distinct, explicitly authenticated, scope/duration-specific owner release after independent proof, with reversible server-side kill switch and verified rollback.

## QL-244 assessor and owner review-request contracts

Use the exact ordered field sets and canonical bytes from `scripts/ql244-witnessed-handshake-review.mjs`; generate Ed25519 signatures entirely outside the repo. The assessor envelope contains `payload` and detached base64url `signature`; required exact payload fields:

```text
schema_version, issuer, kind, assessor_receipt_id, assessor_key_id,
business_id, tenant_id, environment, gateway_audit_id,
identity_attestation_id, health_receipt_id, capabilities_receipt_id,
source_revision, ql243_report_sha256, credential_registry,
negative_test_results, witnessed_at, expires_at
```

The issuer is `rosevear-independent-handshake-assessor`, kind `nonproduction_handshake_review`, `business_id = devilndove`, `tenant_id = null`, `environment = nonproduction`; exact prior receipt IDs and 40-hex revision must match. `ql243_report_sha256` is generated with `ql244ReportDigest`; all seven negative-denial booleans must be true. Signed evidence must be within ±5-minute clock skew and expires within one hour.

The six `credential_registry` rows must appear in this order: `ai-data-platform`, `devilndove`, `rosiedazzlers`, `yw`, `icamp`, `rosevear-ai-hub`. Each has exactly `system_id`, distinct nonsecret `key_id`, distinct `exchange_receipt_id`, `source_revision`, `exchange_state`, `review_state`.

The owner review-request envelope uses `QL244_OWNER_KEYS` in the same script, `issuer: rosevear-owner-review`, `kind: conditional_pilot_review`, `decision: REQUEST_CONDITIONAL_READ_ONLY_REVIEW`, exact two read scopes, prior assessor/identity/audit IDs and source SHA, existing QL-242 rollback receipt ID and owner key ID, and a fresh expiration. Never substitute the actual owner approval or identity documents into this specimen.

## Offline packet and command

Assemble an **untracked PUBLIC** JSON object with exactly `ql243Bundle` (the QL-243 public QL-242/identity signed bundle), `ql243Report` (sanitized successful four-GET QL-243 result), `assessorPublicKeyPem`, `assessor` (signed envelope), and `ownerDecision` (signed review-request envelope). No real HMAC key is read by this CLI.

```sh
node scripts/ql244-verify-conditional-review.mjs \
  --packet ./local-ql244-public-review.json \
  --gateway-pin-sha256 <out-of-band-gateway-public-sha256> \
  --owner-pin-sha256 <out-of-band-owner-public-sha256> \
  --witness-pin-sha256 <out-of-band-identity-witness-public-sha256> \
  --assessor-pin-sha256 <out-of-band-assessor-public-sha256>
```

The verifier performs **zero network or connection setup operations**. `TWO_ADDITIONAL_SIGNATURES_CHECKED_HELD` means only that the signatures mathematically match caller-supplied pins and the linked QL-243 data. It **does not** verify real-world identity, actual credential exchange, audit-store permanence, external test observation or owner consent.

Paste only the **sanitized CLI result** into Comms Hub → **Witnessed handshake & pilot HOLD** for local reference matching. Its browser can neither verify a signature nor connect a service and stores no secrets or durable customer data.

## Required reply from each application

```text
source_system / application:
GitHub repository and exact 40-character SHA, CI success URL:
Nonproduction URL / TLS verification / server-only GET endpoints:
Business ID, issued tenant ID, exact allowed scopes and modules:
Distinct nonsecret key ID and credential registry receipt ID:
Health, capabilities, gateway-audit, identity-witness receipt IDs:
Four public signer pin origins and independent verification channel references:
Original source/test-runner trace, auditor name/reference and independent observation:
Persistence-after-restart audit check and seven negative test receipt IDs:
Revocation / rollback independently witnessed results:
Actual owner authorization: NOT GIVEN
Actual gateway connection: DISCONNECTED / HELD
Missing endpoints, blockers and next safe testing steps:
```

If something is missing, say `NOT IMPLEMENTED` or `UNVERIFIED` rather than inventing proof. Every external evidence source, verifier, tenant and secret must be validated independently. We will reconcile first Devil n Dove, then the other five one at a time.

**Production GREEN only certifies the software deployment, not actual cross-app connectivity or permission.** All four company pilots and all twelve real communications gates remain held pending new, explicit owner authorization and independent evidence.
