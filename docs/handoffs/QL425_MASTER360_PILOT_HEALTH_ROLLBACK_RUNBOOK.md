# QL-425 — Protected Pilot Health Continuity, Fail-Closed Rollback & Three-Master Operator Runbook

QL-425 introduces `checkQl425ProtectedPilotContinuity`, a Node-only backend function for a **single** fresh, protected health check after a real QL-424 verified isolated pilot. It does **not** install a scheduler, start the Windows host, activate a receiver, release the slave gate, or promote general CONNECTED state.

## Mandatory operator sequence
1. Independently verify the original Ree host `DESKTOP-AE894KC`, its registered source SPKI, its original QL-423 durable signed receipts, and a successful QL-424 supervised isolated activation.
2. Confirm three distinct, independently pinned Ed25519 Master public keys for rosevear-ai-hub, rosevear-comms-hub and ai-data-platform. Never paste private keys into GitHub or ChatGPT.
3. Only in an authenticated protected backend context, collect a **new** separately signed `rosevear.ql425.master-pilot-heartbeat.v1` from each Master. Each report must bind exact ceremony ID, source/episode, source/controller commit revisions and a strictly increasing local sequence. A snapshot is fresh for 60 seconds.
4. The protected monitor checks three fresh distinct source-bound signatures and monotonic sequences. Its successful result is `VERIFIED_ISOLATED_PILOT_HEALTH_SNAPSHOT` — not measured continuous uptime or a permanent approval. Persist sequence high-water marks separately with durable backend controls before taking another reading.
5. If any report is missing, expired, replayed, forged, duplicated or mismatched, the monitor calls the injected protected receiver adapter `disableOneTest`, returning connection HOLD. If disable fails or does not confirm, report `UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED` rather than claiming OFF.
6. An operator must inspect the authenticated receiver OFF readback, review incident and custody evidence, and require a **new** QL-424 ceremony and independent approval before restarting any pilot. No automated restart on health loss.

## Operator evidence matrix
- `main` CI GREEN: code integrity only, not runtime pilot.
- No verified original-host input: receiver OFF, connection HOLD, uptime UNKNOWN.
- Valid signed three-Master snapshot: isolated pilot may remain on only within the protected decision context; slave gate remains HOLD.
- Missing/stale/mismatched heartbeat: disable isolated receiver and mark HOLD.
- Disable unconfirmed: manual operator recovery, receiver UNKNOWN; never falsely report OFF.

## Boundaries
The code accepts a previously independently authenticated QL-424 acceptance object supplied by a protected backend, not an untrusted browser assertion. It cannot itself authenticate that object or prove persistent monotonic sequences. The real backend must securely persist accepted QL-424 evidence, separately managed sequence high-water marks, public trust pins and trusted receiver adapter; until these integrations and real signatures exist, operator status remains HOLD.

MASTER360-COMMS-QL425-HANDOFF | source=rosevear-comms-hub | source-build=QL425 | independent-three-master-heartbeats=REQUIRED | exact-ceremony-and-revision-binding=REQUIRED | replay-high-water-persistence=BACKEND_REQUIRED | monitor-scheduling=NOT_INSTALLED | fail-closed-disable=AVAILABLE_WHEN_AUTHORIZED_ADAPTER_INJECTED | actual-original-host-telemetry=UNVERIFIED | receiver=OFF_UNTIL_LIVE_PROOF | connection=HOLD_UNTIL_LIVE_PROOF | runtime-uptime=UNKNOWN | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE

**Next proposed QL-426 — Durable Pilot Health Checkpoint Custody, Independent Rollback Readback & Owner Incident Acceptance Audit.**
