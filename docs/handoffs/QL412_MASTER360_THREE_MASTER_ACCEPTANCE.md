# QL-412 — Master 360 original-host enrollment and read-only three-master acceptance

## Pinned authorities and provenance

- AI Data Platform Build 360 controller contract: `docs/master-shell/MASTER_360_ACTIVATION_CONTRACT.json` at `4b45b435fa7b6fc83b94e31556648fe4190a9f53`.
- Comms Hub previous QL-411 production `main`: `e8ec7853133725bbdf51893548a20cac67ebfbed`.
- AI Hub Build 304 source production `main`: `1a52acf4fc756088d0a1ab38b350f96fccce2a1b`.
- Source acknowledgement: `rosevear-ai-hub/docs/master-shell/MASTER_360_AIHUB_ACTIVATION_ACK.json` explicitly says original Windows installation, persistent samples, source signer enrollment and signed receiver ACK are **HOLD_NOT_VERIFIED**. It is not runtime proof.
- Original host: Ree's `DESKTOP-AE894KC` only. Jack's `TEMPLAR` is an independent review computer. Existing startup/recovery authority is preserved; no duplicate scheduled task.

## Protected code delivered

`runtimes/master-telemetry/ql412-protected-enrollment.mjs` extends QL-411's Ed25519 envelope verifier:

1. Independently supplied public SPKI signer candidate and independently witnessed SHA-256 thumbprint must match exactly, with explicit owner approval, the original host, and pinned source revision. The envelope cannot propose its own key. **Candidate review does not perform enrollment**: actual trusted server deployment still requires authenticated owner action and protected configuration.
2. `openQl412DurableReplayLedger` stores source-scoped episode consumption in a permission-restricted directory. Atomic exclusive-create rejects duplicates across concurrent processes and process restarts. It must run on a protected persistent receiver volume, never in CI, a browser or git. Do not put secrets or user data into replay keys. Protect filesystem ownership, prevent symlinks and backups from weakening integrity, and monitor capacity/retention before enabling operational traffic.
3. Signed, fresh, exact-schema metadata from `rosevear-ai-hub` on `DESKTOP-AE894KC` at an independently pinned revision yields sampled uptime read models and source-bound incident correlations only. No private key, customer data, device secrets, access tokens, remote restart, scheduler modification or customer dispatch.
4. Supervised incident acceptance requires independent reviewer and explicit owner authorization; it is an inert signed-source-scoped read model, not an outbound message or trust grant. Protected calling transport, reviewer authentication and audit storage remain prerequisites to a genuine operational handoff.
5. All paths preserve `connection=HOLD`, `receiver=OFF`, `slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`. Missing or stale evidence is not represented as uptime.

## Owner-gated acceptance steps

1. On Ree's original Windows server, verify that installed Build 304 matches the source revision and that its durable telemetry history is actually running. Do not create a new recovery task.
2. Independently verify the public signer SPKI SHA-256 against the original host through an owner-approved channel. **Do not export the private signer**. Configure a protected receiver authority store; do not use a public source file or browser input as trust.
3. Configure the protected server-side replay ledger on a persistent, access-controlled local volume with backup/retention, process-owner and corruption/replay audit checks. The supplied library is not a hosted endpoint or service installer.
4. Run exactly one owner-supervised metadata-only signed observation through authenticated private transport, pinning the actual source revision. Verify reject paths for bad signature, stale age, replay, foreign host, wrong source and mismatched revision.
5. Independently record source-scoped incident ACK/follow-up with the owner and reviewer, then present actual timestamped verification receipts to the AI Data Platform controller. Until this exists, report runtime telemetry, signer enrollment, ledger deployment, incident handoff and connection as HOLD. Keep the slave gate closed.

## Tested implementation vs. observed runtime

Node tests exercise independent pin review, deterministic signature verification, durable ledger reopen, exclusive-create replay denial, stale data rejection, and inert owner ACK. No real key enrollment, network listener, live telemetry, credential exchange or Windows task was performed here.

`MASTER360-COMMS-QL412-ACK | controller-main=4b45b435fa7b6fc83b94e31556648fe4190a9f53 | ai-hub-main=1a52acf4fc756088d0a1ab38b350f96fccce2a1b | telemetry=CODE_READY_RUNTIME_HOLD | signer-enrollment=OWNER_PROOF_HOLD | replay-store=CODE_READY_DEPLOYMENT_HOLD | incident-acceptance=CODE_READY_OWNER_HOLD | connection=HOLD | receiver=OFF | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`

Append the actual Comms `main` merge SHA only after GitHub checks succeed. Do not assert connected based on deployment GREEN.

**Next proposed build: QL-413 — Protected Three-Master Receipt Intake, Operational Uptime Evidence & Owner-Gated Connection Resolution.**
