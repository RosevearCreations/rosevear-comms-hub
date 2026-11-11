# QL-414 — Original-host one-TEST transport and protected receiver ACK

## Three-master source reconciliation (November 11, 2026)

| Application | Production baseline before QL-414 |
| --- | --- |
| Rosevear Comms Hub QL-413 | `c670c2523001294e8ac2e4f283a1f8e5edda3ddb` |
| Rosevear AI Hub Build 306 | `2780e94077fcee154a22e0e61ace72c36410cb90` |
| AI Data Platform controller | `a5ba69a3e09fb4dd41f2b7586db027ba3e819301` |

The original Master360 activation contract remains pinned to controller revision `4b45b435fa7b6fc83b94e31556648fe4190a9f53`. AI Hub's source-side `docs/master-shell/MASTER360_AIHUB_306_ACK.json` states installed original-host Build 306, seven-day monitoring evidence, signed one-TEST and independent Comms signed receiver ACK are still **HOLD**. Never convert production code GREEN to runtime CONNECTED.

## Implemented protected code contract

`runtimes/master-telemetry/ql414-one-test-transport.mjs` exports:

- `handleQl414OneTest`: a **protected in-process handler**, not an exposed HTTP route. It requires an independently authenticated private transport, separately verified owner and reviewer authorization, original-host Ed25519 source enrollment candidate, persistent replay ledger, pinned exact AI Hub revision, pinned Master360 contract, and independently managed receiver signing callback. It rejects stale, forged, foreign-host, duplicate and cross-source telemetry. Only one metadata-only event is consumed per episode. If all prerequisites pass, it returns a bounded, signed receiver ACK carrying source/host/revision/episode/correlation, signed payload SHA-256, timestamp and a HOLD connection statement. It cannot execute recovery, send messages, start a receiver, or modify Windows tasks.
- `reviewQl414OwnerDecision`: validates the signed receiver ACK using the independently configured public receiver pin, exact source revision, freshness, owner and reviewer approval. Its result is `OWNER_SUPERVISED_ACK_REVIEWED`, never `CONNECTED`; an actual connection activation workflow is separate and currently unavailable.

The test harness uses disposable local Ed25519 keys; those test keys are not source or receiver authority and must never be enrolled. Both the private source signer and protected receiver signer must remain in their authorized original environments. The handler must be integrated by a separately authenticated server component before operational use; **there is no network listener or live transport deployment in this build**.

## One owner-supervised operational acceptance

1. Verify the installed AI Hub 306 release, active launcher identity, durable uptime samples and unique existing recovery task on Ree's original Windows server `DESKTOP-AE894KC`.
2. Independently verify source SPKI public pin enrollment and exact installed revision; review the protected receiver's public pin, signing custody, and persistent replay ledger. Jack's `TEMPLAR` is an independent review machine only.
3. Use approved protected private transport to authorize **one** read-only signed metadata envelope from Ree's original host. Do not export any private key or permit customer/device secret fields.
4. Obtain Comms' independently signed metadata-only receiver ACK from the protected runtime. Verify its cryptographic signature, correlation, original-host source revision, timestamp, ledger replay denial, and incident review record.
5. Attach both authentic receipts and owner/reviewer decision evidence to the AI Data controller. Do not report `CONNECTED` or open slave onboarding until a separately authorized runtime connection-activation decision exists.

## Receipt to AI Data Platform

`MASTER360-COMMS-QL414-ACK | controller=ai-data-platform | ai-data-main=a5ba69a3e09fb4dd41f2b7586db027ba3e819301 | ai-hub-main=2780e94077fcee154a22e0e61ace72c36410cb90 | one-test-handler=CODE_READY_NOT_DEPLOYED | source-signed-receipt=HOLD_NO_ORIGINAL_HOST_TEST | receiver-signed-ack=CODE_READY_NO_RUNTIME_SIGNER | owner-decision=HOLD_NO_INDEPENDENT_RUNTIME_EVIDENCE | uptime=HOLD | connection=HOLD | receiver=OFF | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`

Append final Comms production SHA only after all post-merge checks pass.

**Next proposed QL-415 — Protected Master360 Runtime Receipt Review, Independent Pin Custody & Live Uptime Acceptance.**
