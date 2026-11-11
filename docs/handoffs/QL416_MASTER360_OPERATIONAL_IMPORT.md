# QL-416 — Original-host supervised one-TEST evidence import and master uptime incident reconciliation

**Code-level import/review only. No authentic original-Ree operational evidence was imported by this repository change.**

## Three-master responsibilities

- **Rosevear AI Hub:** original source on Ree's `DESKTOP-AE894KC`; installed-release and signed, metadata-only uptime samples come solely from its actual protected Windows runtime. Existing launcher/recovery authority stays unchanged.
- **Rosevear Comms Hub:** authenticated private one-TEST receiver/ACK and protected, independently stored replay ledger; provides incident correlation and an inert owner decision review. No public ingest endpoint, unattended automation or recovery execution.
- **AI Data Platform:** master controller and uptime reader. Independently verifies the revision, signed evidence and owner decision before interpreting sample trends. This code does not send data to AI Data automatically.

## Protected import contract

`runtimes/master-telemetry/ql416-operational-evidence.mjs` exposes `reconcileQl416OriginalHostEvidence` to an authenticated protected caller. The caller is responsible for verifying the owner and independent reviewer, the installed source revision, the correct AI Data controller revision, and the original durable-commit record from protected storage. Browser-supplied booleans or a file pretending to be that record are not acceptable authority.

The adapter rechecks source identity, original host, source revision, episode ID, signed telemetry, independently witnessed source/receiver public pins, signed receiver ACK, exact payload hash, protected ledger record and freshness (five minutes). It projects per-service sampled uptime, marking services with fewer than two samples as `UNKNOWN`, and flags signed-sample reachability gaps as **incident candidates** for explicit owner review. A reachability gap alone is not proof of a sustained outage.

All outputs (including a successful code-level fixture) retain `connection=HOLD`, `receiver=OFF`, `slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`. `SIGNED_ONE_TEST_IMPORTED_FOR_REVIEW` is **not** a production acceptance or connection grant.

## Direct instructions to AI Data Platform

`MASTER360-COMMS-QL416-HANDOFF | source=rosevear-comms-hub | contract=docs/handoffs/QL416_MASTER360_OPERATIONAL_IMPORT.md | require original DESKTOP-AE894KC installed release proof, independently witnessed source/receiver Ed25519 pins, metadata-only signed one-TEST, durable protected replay record and independently signed correlated receiver ACK | independently check controller revision and receipt age | display sampled uptime UNKNOWN until verified | treat reachability gaps as owner-review incident candidates | do not mark CONNECTED or MASTERS_SYNCED on code GREEN alone | preserve receiver=OFF and slave-gate=HOLD`

## Field acceptance remains HOLD

Owner and reviewer must independently complete a protected one-TEST on the *actual* original host, observe the durable ledger record and receiver ACK, and pass a fresh authenticated evidence packet to the protected adapter. No private keys, telemetry payloads or owner secrets should be copied into GitHub, chat or the public UI. No Windows tasks were added or modified.

**Next proposed QL-417 — Protected Master Evidence Discrepancy Worklist, Uptime Episode Aging & Owner Decision Continuity.**
