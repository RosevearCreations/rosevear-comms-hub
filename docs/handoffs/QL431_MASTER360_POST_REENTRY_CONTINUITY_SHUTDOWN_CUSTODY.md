# QL-431 — Independent Post-Re-entry Pilot Health Continuity, Signed Fail-Closed Receiver Shutdown & Three-Master Incident Custody Reconciliation

## Scope and operational truth

QL-431 is a **protected Node-only, single-cycle** post-re-entry monitor for a **previously accepted and independently reverified QL-430 isolated pilot**. It is not a scheduled Windows task, deployed receiver integration, real Ed25519 signer enrollment, network health monitor or automatic reconnect. Passing GitHub CI does **not** certify a live connected receiver, general six-app connectivity or measured uptime.

QL-430's one-use accepted audit record must be reopened in the original-host private backend and its digest matched to the exact QL-430 runtime result. A separate private operator authority must independently verify the QL-430 result. The isolated pilot continues with **slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE**.

## Protected procedure

1. On original host **DESKTOP-AE894KC**, load protected QL-430 accepted audit, its exact source/controller revisions, original-host session and independently pinned original-host receiver and Master public keys. Never pass raw signing keys to the repo, CI or browser.
2. Each operator-invoked QL-431 observation supplies a new observation ID, a separate incident ID, three independently Ed25519-signed fresh QL-431 health envelopes (one per rosevear-ai-hub, rosevear-comms-hub and ai-data-platform), strictly increasing high-water sequences, and a separately signed receiver **ISOLATED_ONE_TEST_ON** observation bound to QL-430 accepted record digest and full scope.
3. A healthy single observation is fsynced to the private QL-431 checkpoint chain, reopened, and only then returns DURABLE_QL431_POST_REENTRY_HEALTH_SNAPSHOT / VERIFIED_CONNECTED_PILOT. This is **one snapshot, not an uptime SLA or general CONNECTED**.
4. Missing, forged, replayed, stale or conflicting health evidence (including receiver ON), or an unwritable health checkpoint, writes an immutable PENDING incident attempt **before** requesting one disableOneTest action on the protected original receiver. There is no retry/re-enable within the same ceremony.
5. The receiver's disabling acknowledgement alone never proves OFF. The original host must provide a properly signed QL-431 fail-closed shutdown attestation, and a separately pinned independent receiver must provide a fresh signed **OFF** readback bound to the original signed shutdown digest, same observation, incident, revisions and QL-430 acceptance.
6. Only after signed OFF is verified and the append-only private incident chain is fsynced/read back may the result declare DURABLE_SIGNED_FAIL_CLOSED_SHUTDOWN and OFF_VERIFIED_SIGNED_READBACK. Missing independent OFF, forged acknowledgement, exception or storage failure returns HOLD and requires human recovery; it must not advertise OFF or reconnect.
7. A separately authorized reconciliation signs three distinct fresh QL-431 incident custody reports against the exact durable signed shutdown record, followed by distinct owner and reviewer signed acceptance. A final durable RECONCILED entry confirms custody **while keeping the receiver OFF and connection HOLD**. A new QL-429/430 ceremony and independent verification would be necessary for re-entry.

## Custody and security boundaries

The QL-431 ledger is a private absolute directory with restricted permissions, immutable hash-linked indexed records, write-exclusive lock, fsync, atomic head replacement and readback verification. Transitions are one-way: HEALTH* → PENDING → OFF → RECONCILED, with no automatic restart and no acceptance of repeated observation/incident replay. The record chain detects local tampering and truncated tails while its HEAD persists. **Deletion of the entire private ledger by a privileged user requires external independently anchored checkpoint digests**; no external anchor is installed here.

CI tests use synthetic Ed25519 keys and mocks only. They cover healthy ordered signed reports, bounded snapshots, replay/stale/duplicate/forged reports, wrong signed ON state, shutdown signature rejection, independent OFF rejection, failures of protected disable, tamper detection, three independent incident signatures, dual owner acceptance and permanent HOLD. The existing application/Pages/Windows gates remain required.

MASTER360-COMMS-QL431-HANDOFF | source=rosevear-comms-hub | ql430-accepted=PRIVATE_REOPENED_EXACT_DIGEST_REQUIRED | original-host=DESKTOP-AE894KC | ql431-heartbeats=THREE_FRESH_DISTINCT_SIGNED_REQUIRED | independent-receiver=SIGNED_ON_EACH_OBSERVATION | health=BOUNDED_SNAPSHOT_ONLY | fail-closed=PENDING_BEFORE_DISABLE | shutdown=SIGNED_ORIGINAL_ACK_PLUS_INDEPENDENT_SIGNED_OFF_REQUIRED | incident=THREE_SIGNED_MASTER_REPORTS_PLUS_DUAL_OWNER_CUSTODY | state=HOLD_UNTIL_ACTUAL_PROOF | slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | CI=SYNTHETIC_NO_LIVE_EXECUTION

**Next proposed QL-432 — External Incident Checkpoint Anchor Readback, Original-Host Recovery Revalidation & Owner-Gated Isolated Pilot Continuity Review.**
