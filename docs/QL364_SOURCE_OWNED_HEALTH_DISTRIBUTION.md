# QL-364 — source-owned read-only health distribution

This release places a QL-362 one-use GET receipt handler in **each original
source repository** and verifies the QL-363 signed-contract compatibility gate.
It does **not** sign source contracts on behalf of Ree or Jack, provision
private receiver credentials, open a firewall, enable device actions, or
transition any peer to CONNECTED.

| Source-owned repository | Private source handler | Original-owner state |
| --- | --- | --- |
| yw | `server/ql364-source-health.mjs` | HOLD |
| iCamp | `lib/integration-v1/ql364-source-health.mjs` | HOLD |
| rosiedazzlers | `functions/api/_lib/ql364-source-health.mjs` | HOLD |
| devilndove-site | `functions/api/_lib/ql364-source-health.mjs` | HOLD |
| ai-data-platform | `apps/web/lib/ql364-source-health.mjs` | HOLD |
| rosevear-ai-hub | `server/src/rosevear_ai_hub/api/ql364_source_health.py` | HOLD |

## Contract and runtime rules

1. The HTTP path is only `GET /api/integration/v1/shell/health`;
   do not use the legacy `/api/integration/v1/health` credential as authority.
2. The request header `x-rosevear-ql362-request` carries the exact unsigned
   QL-362 request **identifier**, not owner consent. The server must independently
   prove the original signed source + master owner decisions, pinned issuer,
   source revision, environment, and signer custody in `approveOriginalGet`.
3. An atomic durable one-use claim is mandatory before returning HTTP 200;
   replay, storage failure, revoked credentials or missing signer deny.
4. The original source-owned Ed25519 KMS signs only the redacted QL-363 receipt.
   The six source signing keys must be separately pinned and independently
   authenticated in the Comms Hub QL-363 registry. A fixture key never qualifies.
5. Cross-repository distribution requires independent immutable SHA readback of
   each handler **and** authenticated source-signed QL-363 contracts via
   `verifyQl364DistributedSourceHandlers`. GitHub content alone is not a
   cryptographic signature or live TEST result.
6. No customer, tenant, provider, device, command, persistent connection or
   repository-write capability is enabled.

## Original-owner TEST acceptance (not yet performed)

- Ree verifies the original issuer/signer and authenticates the original source
  host. Jack independently authenticates the master owner decision on TEMPLAR.
- Each source owner separately enrolls its key, signs the scoped QL-363 contract,
  and approves one exact QL-362 GET. The private operator verifies both owner
  signatures against independently pinned original keys and enforces durable
  nonce claims. Never put signing material in GitHub, browser fields or logs.
- Run exactly one private, TLS-pinned, size-capped source GET and independently
  verify QL-363 receipt signature, key custody and receiver shutdown witness.
- Archive a redacted six-source result, then close the TEST receiver. Do **not**
  infer CONNECTED from unit tests, files, healthy HTTP, or even a single TEST.

**Current database readback:** zero original enrollments, zero signed TEST
receipts. Genuine original-owner TEST acceptance therefore remains **HOLD**.
