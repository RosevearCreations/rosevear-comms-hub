# QL-411 — Master 360 protected telemetry pilot and activation handoff

## Controller handshake

Token: `MASTER360-COMMS-ACTIVATE`  
Controller: AI Data Platform `main` at `4b45b435fa7b6fc83b94e31556648fe4190a9f53`  
Source: [`docs/master-shell/MASTER_360_ACTIVATION_CONTRACT.json`](https://github.com/RosevearCreations/ai-data-platform/blob/4b45b435fa7b6fc83b94e31556648fe4190a9f53/docs/master-shell/MASTER_360_ACTIVATION_CONTRACT.json)  
Comms reconciled QL-410 `main`: `ccbeab4307ed6458399dcb0eb03324aeaf12f97f`.

The contract requires the **three Master applications** to synchronize before slave onboarding. Software promotion is not evidence of runtime health. All original-owner, receiver and six-peer connection gates remain **HOLD** until actual signed original-host evidence exists.

## What QL-411 provides

- `runtimes/master-telemetry/ql411-protected-telemetry.mjs`: side-effect-free Ed25519 envelope verifier. The original Windows host must be `DESKTOP-AE894KC`, source `rosevear-ai-hub`, the committed AI Hub source revision must equal the independent caller's pinned revision, and the sample must be fresh (5 minutes), bounded (2–1440 records, max 24-hour history) and metadata-only.
- A **separately configured** Ed25519 SPKI public key and a **durable** anti-replay store must be supplied by a protected runtime. Neither may originate from the envelope or browser. Missing key, replay storage, revision, source identity or signature always rejects. The included in-memory test store is not a production substitute.
- Per-service uptime read models are calculated only from signed samples and report the sample count. A service with fewer than two samples has no uptime percentage. These are *sample percentages*, not guaranteed clock-time SLA uptime; no continuous uptime claim is made without a defined sampling window and persistent history.
- Source-bound DOWN incident correlation keys are produced for the Comms operator. An operator ACK is a **claim for review**, not a verified authentication event, notification send, Windows recovery action or incident closure.
- QL-411 owner-screen pilot shows HOLD/UNKNOWN until a protected server adapter has independently supplied and authorized a sanitized read-only projection. The public UI cannot poll Ree's computer or import signed raw packets.

## Required original-host coordination

| Participant | Required action | Evidence currently available in QL-411 |
| --- | --- | --- |
| AI Data Platform Build 360 | Consume a source-scoped read-only uptime model, validate deployment and observation age, keep slave gate closed until all Master requirements complete | Controller contract read at pinned revision; no live ingestion receipt |
| Rosevear AI Hub Build 304 | On Ree's original Windows server, persist bounded uptime history, independently enroll a signing authority, emit metadata-only signed observations and enforce Ree-only scheduling | Contract expected; live original-host evidence not present |
| Comms Hub QL-411 | Verify signed metadata in a protected Node runtime, correlate DOWN incidents by source/episode/service, permit reviewed operator follow-up | Code and negative tests pass locally; production enrollment and durable replay-store evidence absent |

Ree's machine is the only intended automation host. Jack's TEMPLAR laptop remains an independent review machine. Never create duplicate scheduled tasks or move Ree's private authority onto another host. The QL-410 PowerShell probe is unsigned local diagnostic input; **do not feed it directly into this signed adapter** or silently enable a scheduler.

## Protected deployment acceptance (owner-gated)

1. Confirm AI Hub 304 is actually promoted and installed on `DESKTOP-AE894KC`; capture its exact release/process revision and read-only observation history.
2. Independently enroll an Ed25519 public signer pin from Ree's original machine and a protected persistent replay ledger on the receiver. Do not copy or disclose private keys.
3. Authenticate server-to-server requests on a private transport, rate-limit, audit and separately bind the source revision. The current module accepts *in-process* envelopes only; it does not expose an endpoint or create network access.
4. Exercise a **single owner-supervised read-only telemetry projection**. Confirm signature rejection, replay denial, source isolation, timestamps and downtime correlation. No TEST activation or receiver enrollment.
5. Deliver a signed, independently reviewed Comms readiness receipt to AI Data Platform. Only then may AI Data mark the protected-telemetry axis verified; other Master axes and the slave gate stay separately assessed.

## Current activation receipt state

`MASTER360-COMMS-ACTIVATE | contract=VERIFIED | code=IMPLEMENTED | original-host-signed-feed=HOLD | protected-key-enrollment=HOLD | persistent-replay-store=HOLD | live-telemetry=HOLD | incident-handoff-acceptance=HOLD | connection=HOLD | receiver=OFF | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`

The final GitHub `dev` and `main` revisions must be attached to the owner handoff **after** all production checks pass; a green repository alone cannot change any HOLD field.

## Verification and next build

`node --test runtimes/master-telemetry/ql411-protected-telemetry.test.mjs` and `npm --prefix app run test -- src/auth/__tests__/ql375OwnerSixAppDrilldown.test.tsx` plus TypeScript, production bundle and unchanged QL-329 asset budget. Negative cases include missing independent pin, foreign host/source/revision, secret fields, future/stale timestamps, replay, bad signatures and cross-source acknowledgements.

**Next proposed QL-412 — Master 360 Original-Host Signed Telemetry Enrollment, Durable Replay Ledger & Supervised Read-Only Three-Master Acceptance.** Requires original-host owner action and protected runtime enrollment; no speculative live connection declarations.
