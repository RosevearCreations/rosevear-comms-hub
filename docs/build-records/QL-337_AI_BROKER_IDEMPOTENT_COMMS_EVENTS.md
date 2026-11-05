# QL-337 — AI Data Platform broker, Comms TEST event contract and idempotent HOLD effects

Scope: server-only metadata contract preparation. **Main software GREEN does not mean a live source handshake.**

## Shared broker contract

- Canonical v1 registry: `docs/integration/ql337-comms-broker-contract.v1.json`, mirrored by the independent AI Data Platform source.
- Exact event types: `case.handoff.requested` and `task.followup.requested`.
- Comms destination and audience are fixed to `rosevear-comms-hub` / `rosevear-comms-hub:nonproduction`. Environment is `TEST`; unsupported versions and production/phone/SMS events are denied.
- The envelope contains only an opaque reference and hashes, never contact/customer records. Origin application, shell, child and tenant must match independently trusted context.
- Signed Ed25519 packet validation requires a separately pinned key fingerprint, original source receipt, owner/source-owner TEST grants, verified broker workload, reviewed route, child isolation, consent proof, valid nonce and five-minute expiry.
- Negative tests cover forged key/signature, wrong child/tenant/audience/source, HTTP 401/403, origin redirect, future/expired event, rollback, duplicate event, conflicting reuse and nonce replay.

## Exactly-once effects over at-least-once transport

- `runtimes/master-broker/event-inbox.mjs` is private Node-only code; no HTTP route or browser/client import and no actual external delivery.
- `privateBrokerInbox(transaction)` requires a trusted caller-provided atomic database transaction.
- The inbox has independent unique constraints on broker event ID and nonce. A duplicate event with the same canonical hash produces zero new effects; a changed payload or nonce reuse stays on HOLD.
- A single effect-receipt insert is unique per inbox record and effect kind, with state constrained to **HOLD**. No real case/task mutation, provider message or outbound network call occurs.
- Genuine source-level once-only effects require independent end-to-end signed TEST authorization; the mock transaction tests do not supply that external trust.

## Master database custody

- Supabase migration `20261105132334_ql337_private_broker_inbox_no_delivery.sql` applied to RosevearCreations Comms project `gxujcwpktaickcgzyvnu`.
- Two append-only tables created with FORCE RLS; anon/authenticated SELECT/INSERT denied. Three unique constraints and read-optimized tenant/shell index present.
- Independent SQL readback after apply: **0 inbox rows, 0 effect rows; RLS/FORCE true; one append-only trigger per table**.
- No live broker signer enrollment, source route activation, child backfill, customer-data migration or communications release was authorized or performed.

## Source broker boundary

The AI Data Platform Build 291/292 event routes stay `held`. Its QL-337 verifier prepares the same canonical unsigned TEST envelope only after all source/owner proof flags are checked. It does not sign, send, replay externally or claim a genuine Comms receipt. The fixture hash in both repositories is `af38fb0956b2905f5c89a655959d64760af375f677354d18b86910200e3b6599`.

## Release criteria

Required: Comms app full test/production build, QL-337 native tests and exact-main public Worker SHA-256 parity; AI Data Platform TypeScript, focused QL-337 verifier, authoritative PR CI, migration validation and Vercel production evidence. Never call this a working connection without independent source receipt and signed TEST round-trip.

Next build: **QL-338 — Rosevear AI Hub Secure Local Relay, Device Proof & Offline Recovery**; local device owner evidence and relay activation remain separately gated.
