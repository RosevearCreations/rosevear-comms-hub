# QL-240 — Independently Verified Nonproduction Gateway Receipts, Tenant/Key Audit Reconciliation & Owner-Safe Read-Only Pilot Decision Gate

Date: 2026-10-27. Release is **disabled-preview only**. The title describes the evidence standard and isolated verification exercise, **not a claim that real AI Data Platform or business application receipts have been verified**.

## What the build delivers

1. **Nonproduction receipts & pilot HOLD** operator workspace for Devil n Dove, Rosie Dazzlers, Yard Workers and iCamp. Displays the QL-239 source evidence ID, distinct health/capabilities receipt IDs, source readiness, separate manual audit step, proposed future pilot disposition, actual `DISCONNECTED` connection, and all twelve real QL-181 `HELD_UNVERIFIED` gates.
2. Strict source reconciliation: QL-239 external evidence must be present, explicitly held, complete, synthetically rotated and separately reviewed. The QL-239 demo proof cannot progress. The QL-240 intake must match the current source/health/capabilities receipt IDs; claims distinct active/revoked nonproduction key IDs, an independent gateway audit reference, a separate inspector alias and nine negative/security controls. Invalid or overexpanded source data is rejected without retaining its payload.
3. Independent second-review draft requires a new alias distinct from the source submitter, previous reviewer and inspector. Changed QL-239 evidence IDs or receipt IDs immediately invalidate QL-240 readiness. A company-only reset cannot disturb another company's draft.
4. The only future read-only candidate option is **AI Data Platform ↔ Devil n Dove**. Even after the browser-only checklists are completed, it remains `READ_ONLY_CANDIDATE_HELD` and cannot activate a connector. Other applications may request external verification evidence but cannot be nominated by this build.
5. **Actual isolated cryptographic test**, not merely a UI checkmark: `scripts/ql240-nonproduction-receipt-verifier.mjs` verifies Ed25519 detached signatures against supplied pinned public keys; exact v1 fields, application, tenant, gateway, `GET` route, `nonproduction`, `HOLD`, business-specific read-only allowlist, time window, receipt replay, current vs revoked key and signed canonical bytes. Node tests generate ephemeral signing keys and check both positive and negative cases for four companies. This module does not obtain or provision actual registered public keys, authenticate real app identities, access network routes, or authorize side effects.

## What was NOT accomplished or authorized

- No real gateway/server endpoint or public key was provided by another business application and independently pinned by the Comms Hub release.
- No external source GitHub run, receipt, audit record or real signature was fetched or authenticated by the browser.
- No credential, customer record, payment, message body, phone number or secret transferred. No real remote write, SMS, voice or provider dispatch.
- No actual owner consent or QL-181 release. Every **real connection stays DISCONNECTED** and all **12/12 pilot prerequisites remain HELD_UNVERIFIED**.

## Evidence required from all application owners to actually verify a nonproduction handshake

| Required item | Independent acceptance | Current status |
| --- | --- | --- |
| Source commit + CI artifact | Third-party reviewer retrieves source and passing CI run independently | **Not received in this release** |
| Gateway-held health and capabilities responses | Separate signed receipts linked to exact app, environment, tenant, expected GET paths and read-only allowlist | **Not received** |
| Pinned key identity | Owner supplies public key fingerprint/key ID via a trusted second channel; never share a private key | **Not received** |
| Rotation/revocation and replay | Show old-key deny, new-key held-only GET, stale/replayed request denial and rollback evidence | **Not received** |
| Tenant isolation | YW company and iCamp campground mismatches must fail on the receiving server | **Not received** |
| Gateway audit records | Durable trace IDs reconcile exact source, health, capabilities and decision receipts | **Not received** |
| Owner decision | Separately verified signed opt-in to one scoped, reversible read-only pilot, with rollback | **Not authorized** |

AI Data Platform remains the only gateway. Business apps retain their databases and write ownership. Devil n Dove's product #53 and Etsy connection must not be mutated or duplicated by gateway tests. Live communications and provider dispatch require a separate consent/privacy/provisioning program and the twelve actual pilot gates.

## Reproduction

```sh
node scripts/__tests__/ql240-nonproduction-receipt-verifier.test.mjs
cd app
npm run check
npx vitest run src/operator/__tests__/ql240PilotDecision.test.tsx
npm test
npm run pages:build
```

Run `node scripts/ql171-operator-baseline.mjs` from the repo root for the no-new-network/no-new-mutation source audit.

**Next expected Comms Hub build:** **QL-241 — External Nonproduction Gateway Proof Retrieval, Independently Pinned Public-Key Evidence & Devil n Dove Read-Only Pilot Owner Authorization Readiness.** This next build must still require real external artifacts and an explicit separate release decision; it must not auto-enable live connections.
