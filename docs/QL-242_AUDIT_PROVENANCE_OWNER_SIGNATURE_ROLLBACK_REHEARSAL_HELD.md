# QL-242 — Independent gateway audit provenance, owner-signed decision receipt and reversible read-only rehearsal

Date: 2026-10-27. **Production build of a disabled preview only — no actual cross-application connection, live pilot, calls, SMS, dispatch or owner authorization.** The name describes future evidence that must be independently established. Tests use freshly invented Ed25519 key pairs and signatures; no real AI Data Platform audit receipt or owner signing key was received in this release.

## Delivered

1. A **Node-only, offline two-signature verifier** (`scripts/ql242-gateway-audit-owner-rehearsal.mjs`) consumes signed *nonproduction* gateway-audit and separate owner-decision **rehearsal request** envelopes. It independently compares them against **two separate caller-supplied pinned public-key SPKI SHA-256 fingerprints**. It rejects foreign business/tenant, unknown/write capability, production, non-held state, wrong signed receipt IDs, source revision drift, missing rollback receipt reference, expired owner request, revoked-key-denial claims set false, replay in the isolated session and signing key reuse. It cannot prove that the public keys belong to the gateway or actual owner, or that gateway audit records were durably stored.
2. A read-only developer CLI (`scripts/ql242-verify-audit-owner.mjs`) that reads a local non-secret JSON evidence packet plus independently obtained gateway/owner public-key fingerprints. It **does not perform HTTP calls or issue server credentials**. `--rehearse-and-rollback` also runs a deterministic, local state machine: `NOT_STARTED → REVIEW_PREPARED_HELD → SIMULATED_READ_ONLY_HELD → ROLLED_BACK_HELD`. All four actual connections remain `DISCONNECTED` at every step.
3. An operator **Gateway audit & rollback HOLD** workspace: four-company status table; guarded Devil n Dove source/receipt/pin reconciliation across QL-239, QL-240 and QL-241; session-only separate reviewer; held read-only prepare/simulate/rollback controls; invalidation when upstream source or audit changes. The browser only receives a **sanitized CLI report** and cannot verify actual signatures or perform network/storage operations.
4. Tests for signature/pin/source mismatches, fraudulent approval, cross-company scope, negative denial claims, stale requests, local replay and reversal, plus app UI and source-drift safety.

## Exact nonproduction evidence handoff needed from other apps

AI Data Platform and Devil n Dove should jointly return, by independently reviewed channels:

| Source | Evidence required | Never include |
| --- | --- | --- |
| AI Data Platform | Actual source commit SHA and CI run; nonproduction gateway issuer, key ID, **public** Ed25519 SPKI key, immutable audit ID linked to QL-241 health/capability receipt IDs; detached audit signature; date and negative-denial trace IDs | Private keys, bearer tokens, database passwords, customer data |
| Devil n Dove | Same stable product/listing reference scope, specific read-only capability allowlist, negative forbidden Etsy/product writes, rollback plan, business/tenant identity | Etsy write tokens, Product #53 media mutations, cross-app database access |
| Owner (separate trust channel) | A separately authenticated owner identity, independent public key fingerprint, **time-limited request to consider a read-only rehearsal** referencing the exact audit/receipt/source IDs, signed receipt and a rollback reference | Owner credentials or blanket authorization to send SMS, write, or connect |
| Independent reviewer | Independently retrieved source/run, audit datastore record, true server denial outcomes, key ownership, revocation status and reversible server plan | Checkmarks copied from the same applicant without corroborating evidence |

**Important distinction:** a valid detached signature proves only possession of the corresponding private key. It does **not**, by itself, prove who controls that key, whether a log is immutable or that the owner granted consent. QL-242 therefore keeps `independentlyWitnessedProvenance=false`, `ownerIdentityVerified=false` and `actualOwnerAuthorization=false` even when isolated signatures match. Negative-test flags inside a signed audit packet remain **issuer claims** until independently observed against the gateway. Real approvals require a subsequent separate, authenticated process.

## Developer-only usage

When trusted nonproduction evidence exists, prepare a local non-secret packet (not tracked in Git) with the exact `audit` and `owner` Ed25519 detached envelopes and public keys. Both signatures must use the canonical field ordering defined by `ql242Canonical('audit', payload)` and `ql242Canonical('owner', payload)` in the Node verifier. Never include signing private keys. Obtain gateway and owner public SPKI fingerprints from **separate reliable channels**, then execute:

```sh
node scripts/ql242-verify-audit-owner.mjs --packet ./local-nonsecret-signed-packet.json --gateway-pin-sha256 <gateway-public-spki-sha256> --owner-pin-sha256 <owner-public-spki-sha256>
```

The output is a minimal **UNATTESTED HELD** receipt summary. Only this output, *without* the `--rehearse-and-rollback` flag, may be pasted in the QL-242 browser preview. To test the isolated rollback on the development machine:

```sh
node scripts/ql242-verify-audit-owner.mjs --packet ./local-nonsecret-signed-packet.json --gateway-pin-sha256 <gateway-public-spki-sha256> --owner-pin-sha256 <owner-public-spki-sha256> --rehearse-and-rollback
```

That flag does not contact any gateway, mutate a deployment, provision credentials, or sign an actual owner approval. It changes only one in-memory simulated state machine.

## Current acceptance boundaries

- No real nonproduction gateway audit ID, owner signing key or immutable audit store independently received.
- No real owner authorization (a signed *rehearsal request* would still require identity verification and a separate release decision).
- Devil n Dove is the only future read-only candidate; Rosie Dazzlers, iCamp and Yard Workers remain held and isolated.
- Twelve real QL-181 prerequisites are all still `HELD_UNVERIFIED`. No external calls/SMS, provider dispatch, Etsy writes, live database mutations, real customer records or actual server rollout.
- A GREEN deployment means only this **disabled-preview code** passed verification; it never activates a communications service or an integration.

## Verification

```sh
node scripts/__tests__/ql242-gateway-audit-owner-rehearsal.test.mjs
cd app
npm run check
npx vitest run src/operator/__tests__/ql242OwnerSignedRollout.test.tsx
npm test
npm run pages:build
```

Next expected build: **QL-243 — Independent Owner Identity Attestation, Durable Gateway Audit Retrieval & Read-Only Pilot Release-Blocker Resolution.** It must remain HELD until real third-party evidence is verified and separately approved.
