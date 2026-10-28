# QL-241 — External nonproduction GET proof retrieval, independent key fingerprint and owner-safe readiness

Date: 2026-10-27. **Disabled preview; no real pilot is connected.** External gateway receipt signatures were exercised with isolated test keys in CI. No actual AI Data Platform gateway origin, real public-key fingerprint, durable audit or source CI packet has been received or independently verified by this build.

## What was delivered

1. `scripts/ql241-external-gateway-retrieval.mjs`: strictly explicit credential-free nonproduction HTTPS GETs for `/api/integration/v1/health`, then `/capabilities`, from one operator-selected public HTTPS origin. No redirects, URL credentials, local/IP hosts, POST, body, bearer token, provider call or application runtime network access. The code verifies exact Ed25519 signature bytes using the separately supplied public-key SPKI SHA-256 fingerprint; enforces exact gateway/business/tenant, held status, read-only allowlist, receipt IDs, key ID and freshness, rejecting malformed and overexpanded bodies. It returns only minimal redacted status and receipt IDs, never raw HTTP data.
2. `scripts/ql241-retrieve-proofs.mjs`: command-line wrapper that **does not execute GETs** unless the owner/operator explicitly provides local non-secret config, out-of-band fingerprint and `--allow-nonproduction-https-get`. A `401`/`403` from a properly authenticated gateway is treated as a *blocked* result. Do not bypass server authentication or expose credentials to browsers.
3. **External GET proof & owner HOLD** workspace: four-company disconnected evidence matrix, QL-239/QL-240 source references, exact-field sanitized report reconciliation, drift detection, non-persistent per-company reset, independent reviewer alias and a Devil n Dove read-only authorization **request draft only**. The browser neither cryptographically verifies the report nor fetches any gateway endpoint.
4. Negative tests: wrong/nonpublic URL, wrong pin, write/production route, unknown capability, cross-company/campground tenant, altered signature, receipt drift, stale/replayed data, redirect, oversized response, unexpected customer fields, spoofed approval and source drift. CI includes the Node-only regression suite plus TypeScript and app tests.

## Real usage (outside CI, only when genuine nonproduction gateway artifacts exist)

Prepare a **local non-secret JSON config** with exactly these seven fields (do not commit the file or include real private keys):

```json
{
  "company": "devilndove",
  "tenantId": null,
  "origin": "https://replace-with-authorized-nonproduction-gateway.example.org",
  "keyId": "np-current-key-id",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nREPLACE_WITH_REAL_PUBLIC_SPKI\n-----END PUBLIC KEY-----\n",
  "healthReceiptId": "np-health-reference-id",
  "capabilitiesReceiptId": "np-capabilities-reference-id"
}
```

The example URL and key are placeholders: **do not run until an authorized gateway is supplied**. From a separate trusted source, obtain the Ed25519 **public** SPKI SHA-256 fingerprint (64 lowercase hex). Then run:

```sh
node scripts/ql241-retrieve-proofs.mjs --config ./local-nonsecret-config.json --pin-sha256 <fingerprint-from-separate-source> --allow-nonproduction-https-get
```

The verifier makes at most two GET attempts. It does not sign requests or transport credentials and will fail against endpoints that correctly require authentication. Preserve the output as an **unattested candidate report**, not as independent proof of issuer identity. In the operator screen, paste only this small sanitized report after QL-239/QL-240 source receipt IDs match. A successful local form cannot validate its own provenance.

## Still required externally before any real read-only pilot

- Authoritative AI Data Platform source SHA and passing CI run, independently opened and logged.
- Authorized nonproduction gateway URL and secure **server-side authentication** plan; independently witnessed actual signed responses and public-key **provenance** pinned via a second channel.
- Permanent gateway audit IDs and independent denial receipts for wrong business/tenant, revoked key, stale request, replay, mutation routes and rollback.
- Owner-signed, separately authenticated opt-in scoped only to Devil n Dove product/listing *references*; no Etsy/media/inventory mutation, phone/SMS or customer data; rollback and expiry plan.
- Independent release governance for the twelve existing QL-181 real pilot gates, which all remain `HELD_UNVERIFIED`.

At release, the external receipt packet and actual keys are **not provided**. QL-241 only prepares a future owner decision request. No server is connected, no public key is installed into the browser, and **no owner approval** has been recorded.

## Verification

```sh
node scripts/__tests__/ql241-external-gateway-retrieval.test.mjs
cd app
npm run check
npx vitest run src/operator/__tests__/ql241ExternalProofReadiness.test.tsx
npm test
npm run pages:build
```

**Next expected build: QL-242 — Independent Gateway Audit Provenance Verification, Owner-Signed Pilot Decision Receipt & Reversible Read-Only Rollout Rehearsal**. Production release of this **disabled-preview** application is not authorization for real gateway connectivity.
