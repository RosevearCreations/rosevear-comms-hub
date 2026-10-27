# QL-239 — Read-only gateway proof intake, credential rotation dry run & independent four-company review

Date: 2026-10-27. **Comms Hub stays a disabled preview. No actual application handshake or provider dispatch is enabled.**

## Delivered

1. A new **Gateway proof intake & rotation** operator workspace (Rosie Dazzlers, Devil n Dove, iCamp, Yard Workers) receives only limited manually entered evidence *references*: an owner-repository GitHub commit/PR/Actions URL, full commit SHA, unique non-personal evidence ID, two distinct health/capability audit receipt IDs, source capture time, submitter alias and ten reported check outcomes. There is a clearly marked fictional demonstration button. This workspace **does not fetch the link, inspect the external system or validate the submitted evidence**.
2. Strict v1 schema/scope gates check that the company and fictional tenant match, health and capabilities use only permitted `GET` paths through AI Data Platform, only business-specific read-reference capability names appear, and environment/status stay `disabled-preview`/`HOLD`. Extra fields, write/dispatch privileges, stale claimed timestamps, unsupported sources, incomplete negative-test claims, replayed receipt IDs and inconsistent tenants are rejected. Rejected payloads are not retained in the operator ledger.
3. Four-company status matrix, company-scoped reset, a claimed rotation review checklist and independently prepared **HELD** review draft. A distinct reviewer alias is required, but aliases are browser-only text, not authenticated users. Passing any UI control does **not** establish signed identity, source provenance, real credential rotation or owner authorization.
4. An independent Node-only CI dry run reuses QL-238's **ephemeral generated HMAC keys**, verifying each business: initial held health/capabilities; rotation rejecting old signed envelopes; renewed health before new capabilities; replay denial; tenant denial; explicit revocation denial; no command/provider path. It has **no network listener, deployed key, credential storage or external connection**.
5. Mobile-readable controls, keyboard focus indicator, forced-colors handling and tests for all four company boundaries, tampering, source fields, independent review separation, no-network/no-storage and the 12 unchanged real QL-181 pilot holds.

## Evidence other application teams should hand back

| Company / gateway | Required source evidence (never include secret values or customer records) |
| --- | --- |
| AI Data Platform | Deployed nonproduction registry/GET broker commit and CI links; registered audience/issuer and key ID policy; signed request verification results; replay/idempotency and immutable audit IDs; tested rotation/revoke/rollback; explicit business/tenant claim checks. |
| Devil n Dove | Full source revision and verified health/capabilities response *field names/status only*; signed gateway receipt; read product/listing reference allowlist; negative write/Etsy tests. Product #53 actual data must not be copied into Comms Hub. |
| Rosie Dazzlers | Signed health/capabilities receipt IDs; only quote/booking reference capability names; consent and live SMS/calls denied. |
| Yard Workers / PMS | Independent company tenant and enabled-module denial test receipts; job/property reference read-only capabilities; credential revocation negative tests. |
| iCamp | Independent campground tenant denial receipts; site/reservation reference read-only capabilities; expired/replayed signature rejection. |

## Independent acceptance still BLOCKED

The operator can only record **PROOF_CLAIM_HELD** or a failure. “INDEPENDENT_REVIEW_DRAFT_HELD” means different text aliases drafted a review; it is not a signed reviewer attestation. “SYNTHETIC_ROTATION_CHECKLIST_HELD” records a local review step; it is not evidence that deployed credentials rotated. For real acceptance, an independent reviewer must retrieve the source and run logs, verify deployed server identity and signatures, reconcile key IDs/rotation/revocation, compare exact tenant isolation and audit receipts, verify freshness and rollback, and obtain separate owner authorization. Even then, only a later separately approved read-only gateway pilot could change connectivity. The current actual connection remains **DISCONNECTED** for all four companies, with no customer data, no external writes, no real phone/SMS, and **12/12 QL-181 live-pilot prerequisites HELD_UNVERIFIED**.

## Reproducible checks

From the repository root:

```sh
node scripts/__tests__/ql239-credential-rotation-dry-run.test.mjs
```

From `app/`:

```sh
npm run check
npx vitest run src/operator/__tests__/ql239GatewayProofReview.test.tsx
npm test
npm run pages:build
```

Run `node scripts/ql171-operator-baseline.mjs` at repo root to confirm the disabled-preview no-new-network/no-new-mutation static boundary.

## Next expected Comms Hub build

**QL-240 — Integration Contract v1 Independently Verified Nonproduction Gateway Receipts, Tenant/Key Audit Reconciliation & Owner-Safe Read-Only Pilot Decision Gate.** Still held until actual external proofs exist and separate owner approval is provided.
