# QL-426 — Durable Pilot Health Checkpoint Custody, Independent Rollback Readback & Owner Incident Acceptance Audit

## Scope and non-claims
QL-426 adds a **protected Node-only custody and operator-evidence module** (runtimes/master-telemetry/ql426-durable-pilot-custody.mjs), negative regressions and an updated protected audit workflow. It does not install a scheduler, start a receiver, turn on original-host communications, collect live Windows telemetry, configure user credentials, or claim all six apps CONNECTED. **Code GREEN does not establish runtime GREEN.**

QL-425 produced a single signed health snapshot but did not persist monotonic sequence high-water marks, independently verify the signed receiver OFF state after rollback, or hold a durable owner incident acknowledgement. QL-426 connects these safeguards for **one isolated pilot**.

## Protected operator sequence
1. Independently verify QL-424's original Ree host (DESKTOP-AE894KC), three signed Master source/Comms/controller operational acceptances, the QL-423 replay chain and an actual original-host isolated receiver ceremony. The backend must supply authentic accepted QL-424 state, not browser flags.
2. Configure independently pinned Ed25519 public keys for each Master, the receiver and distinct owner/reviewer. Keep private signing material on the original trusted devices. Configure a **private, absolute, permission-restricted and durable** Node ledger directory on the trusted backend.
3. For each fresh pilot-health reading, call runQl426ProtectedPilotAudit inside an authorized backend session, with exact QL-424 ceremony/episode and source/controller SHA identity. The monitor invokes QL-425's signature and freshness verifier, with previous persistent high-water marks, and commits an immutable HEALTH record plus an atomic/fsynced head.
4. When health fails, QL-425 attempts receiver shutdown. QL-426 then separately requests **fresh source-bound signed OFF receiver readback** using the independently pinned receiver public key and exact incident ID. Only a correctly signed, fresh OFF state is admitted as a ROLLBACK incident. An adapter-returned disabled: true alone is insufficient.
5. Durable ROLLBACK stays connection HOLD. A distinct owner and independent reviewer may issue a fresh dual-Ed25519-signed acknowledgement **bound to that rollback checkpoint digest**. acceptQl426OwnerIncident writes OWNER_ACK to the append-only chain and remains connection HOLD. It is an acknowledgement, **not permission to restart**.
6. Before any new isolated pilot, require a new QL-424 ceremony and separate independent operational acceptance. This module does not re-enable a receiver or release the slave gate.

## Failure responses
- Any invalid QL-424 authority, unreadable/tampered ledger, expired/duplicate three-Master reports, or ledger write failure: **HOLD**.
- Missing/invalid/offline receiver-signed OFF readback: **receiver UNKNOWN, manual recovery required**; never report OFF from an unverified acknowledgement.
- Valid signed OFF readback but incident persistence fails: **HOLD**, signed OFF observed but not durably recorded.
- Owner signature or rollback digest mismatch, replay, duplicate owner/reviewer identity: **HOLD**.
- Successful isolated health checkpoint: **verified one-time snapshot only**, not measured continuous uptime.

## Persistence and limitations
Entries are whitelisted metadata only (exact source, episode, SHA revisions, sequence watermarks, checkpoint/incident identifiers and evidence hashes), not private signing keys, bearer credentials, raw source receipts or customer data. Exclusive lockfiles and immutable numbered records protect writes; atomic HEAD replacement, fsync, chained SHA-256 and reopening verify consistency. A crash with an orphan checkpoint fails closed and requires authorized recovery. A privileged host operator could truncate both HEAD and tail without detection by local hash-chaining alone: externally witnessed HEAD digests/remote immutable custody are required for higher assurance, and real remote replicated storage is **not** included in this build. Ledger disk/device integrity, QL-424 acceptance authentication, pin custody, scheduling, and receiverAdapter implementation are supplied by a separately protected deployment.

## Tests and production gate
node --test runtimes/master-telemetry/ql426-durable-pilot-custody.test.mjs covers exact signed Master continuity, durable reboot readback, anti-replay, missing reports, independent receiver signature forgery, corrupted storage, and owner/reviewer acceptance. .github/workflows/ql418-owner-sla-audit.yml includes these checks for PRs and pushes to dev and main. Preserve the ordinary app, Windows owner-key, and production parity gates.

MASTER360-COMMS-QL426-HANDOFF | source=rosevear-comms-hub | build=QL426 | original-host=DESKTOP-AE894KC | prior-QL424-acceptance=INDEPENDENT_BACKEND_REQUIRED | durable-chain-store=AVAILABLE_NOT_CONFIGURED | externally-witnessed-head=REQUIRED_FOR_REMOTE_CUSTODY | protected-monitor-scheduler=NOT_INSTALLED | independent-receiver-OFF-signature=REQUIRED | dual-signed-owner-incident-ack=REQUIRED | receiver=OFF_UNTIL_REAL_PROOF | connection=HOLD_UNTIL_REAL_PROOF | runtime-uptime=UNKNOWN | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE

**Next proposed QL-427 — Independent Pilot Checkpoint Witness Export, Post-Rollback Receiver Isolation Assurance & Three-Master Recovery Closure.**
