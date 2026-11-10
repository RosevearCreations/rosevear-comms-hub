# QL-413 — Three-Master protected receipt intake and owner-gated resolution

## Source reconciliation, 2026-11-10

- Comms QL-412 production baseline: `e42ffa856595a2d24c634653d83b1d80f2d6eaa4`.
- AI Hub Build 305 source `main`: `27b234337f5a3f041dfca4541e33ed6aa821fa4f`.
- AI Data Platform controller `main`: `69355a853f10bbe4d3785bcede8b44e0c788be65`.
- Original Master360 contract remains pinned at AI Data Platform `4b45b435fa7b6fc83b94e31556648fe4190a9f53`.
- Build 305 [`MASTER360_AIHUB_305_ACK.json`](https://github.com/RosevearCreations/rosevear-ai-hub/blob/27b234337f5a3f041dfca4541e33ed6aa821fa4f/docs/master-shell/MASTER360_AIHUB_305_ACK.json) says installation, durable monitoring, signed one-TEST telemetry, and independently signed Comms receiver ACK are not verified on Ree's original host. No genuine runtime evidence was supplied to Comms.

## Protected receipt intake

`runtimes/master-telemetry/ql413-protected-receipt-intake.mjs` accepts exactly three Ed25519-signed, metadata-only receipts, one each from AI Data Platform, Comms Hub, and Rosevear AI Hub. Each must match an **independently provisioned** signer pin and exact deployed revision. A signed AI Hub receipt must name `DESKTOP-AE894KC`; controller/Comms receipts must identify a protected master runtime. Fields are strict, signed and recent (five minutes). No private keys, customer data, raw device diagnostics or credentials are accepted.

The replay ledger from QL-412 recognizes source-bound master receipt keys and uses exclusive-create persistence. Tests verify tampering, stale timestamp, wrong host, missing source, missing pin, and replay after reopening the persistent ledger. A future protected runtime must provide actual owner-authorized network authentication, independent pin enrollment, audit retention, filesystem security and receipt transport. **This repository contains no live intake endpoint or installed receiver**.

`reviewQl413ThreeMasterReceipts` returns a `SIGNED_RECEIPTS_REVIEWED` read model only after all signatures pass. Even if all receipt payloads claim VERIFIED, their self-attestation is not itself sufficient to mark operational uptime, trust connection or master sync. `resolveQl413Connection` stays HOLD even with owner consent and a caller-supplied runtime attestation; the separate hardened connection-activation procedure is deliberately not implemented. This prevents forged or test receipts from activating the system by software promotion alone.

## Owner-supervised resolution checklist

1. Independently inspect the real installed AI Hub Build 305 process and persistent uptime samples on Ree's original `DESKTOP-AE894KC` machine. Preserve its existing scheduled task and recovery launcher.
2. Confirm the protected Comms receiver host, independently enrolled source public signer pin SHA-256, and a backed up protected persistent replay ledger. Never disclose the private signer.
3. Run exactly one owner-supervised, authenticated, signed metadata-only telemetry receipt and check independent Comms acknowledgement, age, source revision, and replay denial. Record the actual evidence and signer identity with timestamps in the protected authority store, not GitHub.
4. Have Ree and an independent reviewer assess all three Master receipts and the incident ACK; capture a separate explicit connection decision only through the protected authority procedure. Do not infer connection from source code or public ACK JSON.
5. AI Data Platform retains `HOLD_NEXT_MASTER_INTEGRATION_STAGE` for YW/iCamp and other applications until actual signed runtime evidence and all independent master axes are verified.

## Master360 handoff

`MASTER360-COMMS-QL413-ACK | controller=ai-data-platform | controller-main=69355a853f10bbe4d3785bcede8b44e0c788be65 | ai-hub-main=27b234337f5a3f041dfca4541e33ed6aa821fa4f | receipt-intake=CODE_READY_RUNTIME_HOLD | operational-uptime=HOLD | protected-signer=HOLD | durable-replay-ledger=CODE_READY_DEPLOYMENT_HOLD | incident-acceptance=HOLD | owner-connection-decision=HOLD | connection=HOLD | receiver=OFF | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`

Append the final Comms `main` SHA only after all GitHub production checks pass.

**Next proposed build: QL-414 — Original-Host One-TEST Receipt Transport, Signed Receiver ACK & Protected Owner Decision Evidence.**
