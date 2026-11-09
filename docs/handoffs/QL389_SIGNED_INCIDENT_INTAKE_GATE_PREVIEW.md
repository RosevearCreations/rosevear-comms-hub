# QL-389 — Source-Signed Incident Intake Authentication, Replay Protection & Authorization Gate Preview

**Release scope: PREVIEW_ONLY.** No original owner signer, server-pinned key, receiver, endpoint, replay ledger, transport, live authorization or customer access is enabled by this build.

## Shared application contract

1. Build a shell-level event matching [QL-388 intake V1](../../api/contracts/ql388-cross-app-intake-v1.schema.json). Keep business and customer records in the originating app.
2. Produce an **independent detached Ed25519 signature** envelope conforming to [QL-389 signature preview schema](../../api/contracts/ql389-detached-signature-preview-v1.schema.json). Fields: `algorithm` = `Ed25519`, `keyId` = an opaque source-specific key identifier, `signatureBase64Url` = an unpadded base64url Ed25519 64-byte signature. There is no embedded public key or self-asserted approval in the event.
3. Sign the bytes of `ROSEVEAR-COMMS|QL389|INTAKE-V1\n` (the final character is a literal newline) followed by UTF-8 JSON of the **complete QL-388 event**, in exactly the following key order: `contractVersion`, `messageId`, `correlationId`, `idempotencyKey`, `sourceId`, `destinationId`, `tenantScope`, `kind`, `category`, `severity`, `eventCode`, `occurredAt`, `evidenceRefs`. Do not append whitespace or omit empty `evidenceRefs`. This deterministic representation is implemented in `ql389CanonicalIntakeBytes`.
4. The designated receiver must independently retrieve the owner's approved public-key pin bound to the expected `sourceId` and `keyId`; never trust a public key included with an incoming message. QL-389 accepts simulated pins **only for local review**, and therefore cannot establish real source authentication.

## Security evaluation order

| Gate | Requirement | Fail-closed example |
| --- | --- | --- |
| Envelope | Exact QL-388 V1 shell-only schema and six-source ID | Unknown company, payload or wrong destination |
| Pin | One matching source/key pin from independently trusted receiver configuration | Missing/duplicate pin or wrong source |
| Signature | Ed25519 verifies against the canonical event and pinned key | Invalid key, changed event, altered signature, unsupported algorithm |
| Freshness | Receiver clock is trusted; occurrence age at most five minutes and future skew at most one minute | Stale or future event |
| Replay | Atomic durable check by `(sourceId,messageId)` and `(sourceId,idempotencyKey)` | Previously seen source-scoped key |
| Policy | Explicit source-to-Comms-Hub route, kind/category, separate owner approvals and actual receiver enrollment | Unapproved route, held owner or receiver |

The order protects source authenticity before considering replay and route privileges. Production must perform signature verification, clock validation, replay lookup **and reservation atomically** where required; a request-local collection is insufficient. Retries must not create duplicate incidents. A denied request must not mutate the trusted ledger or expose private evidence. Any acceptance and operator workflow will be specified in a later separately authorized receiver build.

## Preview interface

`app/src/auth/ql389SignedIntakePreview.ts` exposes `reviewSignedIntakePreview` and the deterministic signing bytes. It uses Web Crypto Ed25519, an **injected synthetic scenario** (pins, route allowlist, assumed owner decisions, replay readback and clock), and returns one of:

- `DENIED` — a validation, source signature, time, duplicate or policy gate failed; the result names a non-sensitive stage.
- `PREVIEW_ONLY` — the synthetic scenario passes, but no real acceptance or authority is established. This result is never `ACCEPTED`, `AUTHORIZED`, `CONNECTED` or a production health status.

There is **no network call**, write, durable replay store, private key, original-owner enrollment, unattended signature, or live notification. The owner screen only documents the gates and links to this handoff. Do not provide user-controlled scenario flags as authorization evidence to any live endpoint.

## Independent work required for production intake

1. The source application owners confirm exact signer identity and publish separately approved public-key pins through the existing original-device ceremony.
2. The master owner authorizes the source/event/destination route and sets explicit revocation and rotation rules; affected tenants require separate consent and isolation.
3. A genuine protected receiver validates source signatures, fresh owner authority, receiver trust, replay reservations and rate limits using trusted server-side state. No silent approval or status upgrade.
4. The receiver logs redacted acceptance/rejection evidence, with correlation ID, source ID and idempotency key only; private payloads remain excluded.
5. Coordinate contract evolution with AI Data Platform; health and completion telemetry continue there. Treat release GREEN as code promotion only, not proof of live attachment.

## Acceptance tests

Synthetic ephemeral Ed25519 keypairs demonstrate valid signature verification returning **PREVIEW_ONLY** and rejection of tampering, wrong key, missing/duplicate pin, unsupported algorithm, stale/future timestamps, replayed IDs, cross-source isolation, unknown tenants, route mismatch and held owner/receiver decisions. No real signing material or original-owner device was used.
