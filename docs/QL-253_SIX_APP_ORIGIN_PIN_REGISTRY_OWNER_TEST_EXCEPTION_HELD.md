# QL-253 — Six-App Published Proof Origin Verification, Independent Pin-Registry Challenge Renewal & Owner TEST-Only Authorization Exception Closure (HELD)

## Outcome

The application adds a dated public six-app source-proof recheck, an allowlisted public GitHub-only opt-in CLI, a stricter offline pin-registry/owner TEST-only exception checker, fail-closed regression tests, and an operator-facing QL-253 HOLD panel. All six observed immutable GitHub proofs were HTTP 404 as of **28 October 2026, 10:43 p.m. Eastern**; snapshot SHAs and remediation are in `ROSEVEAR_QL253_SIX_APP_PROOF_ORIGIN_PIN_REGISTRY_OWNER_TEST_HANDOFF.md`. The observed failures are specific to the signed integration proof file; they do not prove normal application CI or production deployment failed.

## Security and custody gates

- Source A must be a real verified source SHA with exact matching GREEN CI; proof commit B must be an actual descendant containing genuine Ed25519 proof bytes, with immutable bytes digest. QL-249’s public verifier validates signature/origin/CI when source proof exists but never elevates a self-signed public key to trusted custody.
- QL-253 offline pin-renewal packet has strict fields for system/repository, A/B, business, approved nonproduction tenant, matching public SPKI digests, pin-registry snapshot digest, three different opaque receipt IDs, five-minute nonce, channel claim and observation clock. Replay, altered digest, wrong business or tenant, excessive clock window and extra fields fail closed.
- Even perfectly matched metadata yields `PIN_REGISTRY_METADATA_MATCHED_INDEPENDENT_CUSTODY_STILL_HELD`. A human independent registry custodian and distinct witness must authenticate actual provenance privately. The code **does not** authenticate anyone by itself.
- Owner TEST-only exception is restricted to `nonproduction`, one GET, `/api/integration/v1/health` and `/api/integration/v1/capabilities`, and a future 30-minute-or-shorter UTC window. It accepts `NOT_GIVEN`/`REQUESTED_PRIVATE_REVIEW` as review *claims*, rejects any claimed approval, and cannot schedule a GET. A private authenticated owner decision is still missing; any eventual owner pilot release is a separate gate.
- Rosevear AI Hub always-on machine was assessed as optional private outbound relay design. No machine was reached, no background service installed, no inbound access opened and no vault, camera, home-device or secret permissions granted. An external gateway or server does not bypass key custody/owner permission.

## Commands and deployment boundary

`npm run verify:ql253` executes synthetic offline negative checks. `npm run integration:ql253-public-proof` has zero network by default; add `-- --public-get` to fetch only precisely allowlisted public GitHub metadata and the immutable QL-246 proof. Existing TypeScript, Vitest and Vite build checks remain part of the normal CI. No external gateway GET, test scheduling, writes, calls, SMS, dispatch, payment, home device or live pilot is performed.

**Separate statuses:** software branch CI/deployment may be GREEN while **all six integrations remain `DISCONNECTED / HOLD`**, owner TEST authorization `NOT_GIVEN`, real GETs zero, and all 12 live pilot safeguards HELD. Do not claim otherwise after promoting this code.

**Next queued candidate:** QL-254 — Six-App Original Signed Proof Retrieval Follow-Up, Independent Private Pin Registry Witness Evidence & Reversible 24/7 Relay Readiness (HELD).
