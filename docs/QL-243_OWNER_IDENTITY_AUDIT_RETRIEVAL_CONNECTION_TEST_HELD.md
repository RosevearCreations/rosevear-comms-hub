# QL-243 — Owner identity, durable gateway audit retrieval & secure connection-test blockers

Date: 2026-10-27 (Eastern). **Disabled-preview code only; no real external nonproduction endpoint, owner identity or gateway secret was supplied for this build.** A GREEN deployment indicates tested code, not a live cross-application connection.

## Implemented

1. **Three separately pinned Ed25519 proofs:** The Node-only verifier checks the existing QL-242 gateway audit and owner *rehearsal request* plus a distinct external identity-witness signature on an opaque owner-key challenge. It binds the witness attestation to exact source SHA, business/tenant, receipt IDs and read-only scopes, rejecting stale, foreign, forged or expanded claims. This establishes only **cryptographic signature matching**, not real-world owner identity or consent.
2. **Secure nonproduction gateway test adapter:** `scripts/ql243-secure-gateway-connection.mjs` signs four strictly allowlisted HTTPS GETs (health, capabilities, gateway audit, same audit again) using a unique per-source **server-only 256-bit HMAC test key**. Each GET gets a fresh nonce. It checks Ed25519 response pins/signatures, exact schema, HELD state, tenant, no redirects and bounded JSON; it fails closed without a valid key and upstream evidence.
3. **Explicit operator CLI:** `scripts/ql243-test-connection.mjs` defaults to **offline**, with no network. The optional `--allow-authenticated-nonproduction-gets` flag requires a matching non-secret config and a base64 secret supplied **only through the secure test environment**. It returns a minimal HELD summary and never persists/signs approvals, connects a production tenant or posts data.
4. **QL-243 operator workspace:** Six-app evidence checklist, four-company disconnected matrix, strict sanitized CLI-summary reconciliation against QL-242 and open blocker list. No browser network or storage operations, keys, provider dispatch, calls or SMS.
5. **Shared six-app handoff:** `docs/ROSEVEAR_INTEGRATION_V1_CONNECTION_TEST_HANDOFF_QL243.md` includes the exact canonical signature, per-app tasks, return evidence template, external witness schema and safe four-GET command.

## Must still be established outside this repository

- Real AI Data Platform and Devil n Dove **nonproduction** endpoints, separately provisioned registered server test keys, and authentic test receipts.
- Independent **gateway audit datastore** inspection across restart/redeploy. Two identical HTTP reads do not prove immutability or actual storage.
- A vetted independent identity-witness trust anchor and witnessed real owner key control; separately authenticated owner consent for a precisely scoped *read-only pilot*. No QL-242 or QL-243 signature is an actual owner release.
- Nonproduction negative tests on **all six apps**, rotated/revoked credentials, foreign business/tenant denial and server-side replay suppression with independent evidence.
- The twelve QL-181 **live** communications conditions remain `HELD_UNVERIFIED`. No live messaging, dispatch, customer records, Etsy mutations, local device control or cross-app writes.

## Verification

```sh
node scripts/__tests__/ql243-secure-gateway-connection.test.mjs
cd app
npm run check
npx vitest run src/operator/__tests__/ql243ConnectionTesting.test.tsx
npm test
npm run pages:build
```

**Next expected:** QL-244 — Independently Witnessed Nonproduction Handshake Acceptance, Per-App Credential Exchange Review & Conditional Read-Only Pilot Authorization Decision. This is **not** an automatic connection-release action.
