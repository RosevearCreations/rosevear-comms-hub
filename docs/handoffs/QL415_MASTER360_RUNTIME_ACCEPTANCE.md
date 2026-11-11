# QL-415 — Protected Master360 runtime receipt, independent pin custody and uptime acceptance

This build adds **protected read-only runtime evidence review** across the three Master systems. It does not generate, claim or upload any actual original-host evidence.

## Reconciled authorities

- Comms Hub previous QL-414 production merge: `182fe951379605cbb909e7072009b59c9e498126` (post-merge checks must still be verified independently).
- AI Hub Build 307 source baseline: `34e017dcf0586a7281d8726d5e8fb4a4a7054526` (verify current `main` again immediately before deployment). `docs/master-shell/MASTER360_AIHUB_307_ACK.json` still reports original-Ree field proof, source one-TEST and authenticated Comms ACK as HOLD.
- AI Data Platform controller baseline: `a5ba69a3e09fb4dd41f2b7586db027ba3e819301` (verify again before handoff).
- Original Master360 authority contract: AI Data Build 360 revision `4b45b435fa7b6fc83b94e31556648fe4190a9f53`.
- Ree original Windows host: `DESKTOP-AE894KC`. Jack's `TEMPLAR` remains independent reviewer only.

## Evidence contract

`runtimes/master-telemetry/ql415-runtime-acceptance.mjs` verifies, in a protected server context:

1. Owner and reviewer independently witnessed SHA-256 public-key pins for both original AI Hub source signer and Comms receiver signer, matching separate Ed25519 SPKI public keys. This function does not enroll keys or confer owner identity by itself; callers must enforce authenticated authority and protect custody records.
2. An exact original-host installed source revision and a signed metadata-only telemetry envelope naming `DESKTOP-AE894KC`, fresh within five minutes and with bounded observations.
3. Durable replay admission attested by the trusted protected runtime, and a distinct signed Comms receiver ACK whose episode, source revision and payload SHA-256 match the source envelope.
4. Explicit owner and independent reviewer approval for an **inert review** result. Only sampled per-service uptime percentages are calculated; missing sample history is UNKNOWN, not 100% healthy.

The output `OWNER_REVIEWED_RUNTIME_EVIDENCE` is a *read model* and is never a connection activation. All outputs retain `connection=HOLD`, `receiver=OFF`, and `slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`. No network endpoint, Windows task, private signer, recovery command or customer communication is added.

## Original-host owner acceptance checklist

1. On Ree's original Windows server, confirm installed Build 307 revision and active API/client/Caddy process identity, using the existing recovery/launcher authority without creating duplicate tasks.
2. Inspect the persisted seven-day uptime samples; authenticate the original-host public source signer pin and separate Comms receiver pin through independently witnessed custody.
3. Execute one explicitly owner-supervised protected QL-414 signed metadata-only one-TEST using the approved private transport. Check the durable replay ledger and signed receiver ACK, independently and on the same episode.
4. Import only authorized evidence to the protected QL-415 reviewer. Preserve complete audit evidence for an actual owner decision and report the source observation age to AI Data Platform.
5. Do not mark Masters synced, connection accepted, receiver enabled or slaves onboarded until a separate protected connection-activation decision is independently verified.

## Master360 handoff receipt

`MASTER360-COMMS-QL415-ACK | source=rosevear-comms-hub | code=GREEN_WHEN_PROMOTED | runtime-telemetry=HOLD_NO_ORIGINAL_HOST_OBSERVATION | installed-release=HOLD | signer-custody=HOLD_NOT_INDEPENDENTLY_WITNESSED | receiver-signed-ack=HOLD | durable-replay=CODE_READY_RUNTIME_HOLD | uptime=UNKNOWN | owner-decision=HOLD | receiver=OFF | connection=HOLD | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`

**Next proposed QL-416 — Original-Host Supervised One-TEST Operational Evidence Import & Master Uptime Incident Reconciliation.**
