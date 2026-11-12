# QL-432 — External Incident Checkpoint Anchor Readback, Original-Host Recovery Revalidation & Owner-Gated Isolated Pilot Continuity Review

## Outcome and scope

QL-432 adds a protected Node-only, single-use evidence chain that extends QL-431's **reconciled OFF incident**. Its output is an owner-gated decision to **review a future new isolated pilot ceremony**, not permission to enable the previous receiver, resume a shut-down QL-431 ceremony, or change any of the six applications to CONNECTED. The only accepted operational result keeps receiver OFF and connection HOLD.

This delivery ships no scheduler, external anchor service, original Windows receiver integration, live private keys, automatic recovery or physical-device evidence. GitHub CI executes synthetic Ed25519 unit tests only. Code deployment does not prove a real anchor, original-host readback or uptime.

## Protected original-host sequence

1. On **DESKTOP-AE894KC**, independently verify the original QL-430 accepted record digest using its private one-use audit and the exact signed scope (ceremony, source, episode, source/controller SHA). Retrieve the QL-431 private hash-linked chain and require a final, durable `RECONCILED` incident record with signed OFF custody, three-Master and owner reconciliation. If the record is missing, tampered or only PENDING/OFF, return HOLD.
2. Create a fresh **one-use unique challenge nonce** and an explicitly labeled **anchor export proposal**. It contains only scoped metadata: original QL-430 accepted digest, QL-431 final checkpoint index/digest, incident ID, receiver OFF digest, anchor identity and issued time. Preparing an export does not count as anchoring.
3. In independently protected off-host custody, the external anchor must actually pin the exact immutable checkpoint and sign it with a trusted Ed25519 anchor key. A **separately signed independent reader**, using a different key, must perform a fresh readback and return a signature bound to that anchor digest, export digest and same nonce. The source must call a real protected external adapter at runtime; the reference code provides only a fail-closed interface. A local mocked callback in CI does not count.
4. Require a fresh **original Windows host** signed receipt with machine ID DESKTOP-AE894KC and receiver OFF, bound to the same incident, external anchor, independent readback, nonce and exact source/controller revisions.
5. Require a separately pinned **independent receiver** to sign a fresh **OFF** readback, observed no earlier than original-host evidence and bound to the host receipt and external readback. Reused, forged, stale or ON claims fail closed.
6. Receive three fresh independently signed Master recovery disposition reports from rosevear-ai-hub, rosevear-comms-hub and ai-data-platform. Each must bind to the exact external checkpoint readback and independent OFF digest; all three say `RECONCILED_OFF_NEW_CEREMONY_REQUIRED`.
7. Require a distinct independently authorized owner and reviewer to sign the exact ordered Master digest, incident scope and decision `ACKNOWLEDGE_RECOVERY_ONLY_NEW_ISOLATED_CEREMONY_REQUIRED_KEEP_OFF`.
8. **Before accepting**, reopen the original QL-431 checkpoint and compare index, incident and digest to the off-host pin. Then atomically record a private one-use metadata receipt with exclusive creation, fsync and readback; a second attempt for the same incident is rejected.
9. The only success status is `DURABLE_QL432_EXTERNAL_ANCHOR_RECOVERY_OWNER_REVIEW` with connection HOLD, `OFF_VERIFIED_SIGNED_READBACK` and `HOLD_NEXT_MASTER_INTEGRATION_STAGE`. Any actual re-entry requires a **new owner-supervised QL-429/430 ceremony and independent activation proofs**. This module never calls enableOneTest, disableOneTest or promotes universal CONNECTED.

## Negative evidence and release gates

Tests cover valid two-signer external anchor readback, mismatched externally pinned checkpoint, replayed challenge nonce, forged independent reader, missing external service, wrong original host (TEMPLAR), forged host or receiver signatures, receiver ON substitution, three-Master missing/duplicate/forged reports, missing or forged dual-owner consent, tampered QL-431 chain, replayed owner review and tampered one-use ledger. All rejection paths preserve HOLD. GitHub CI must also pass application, Windows owner-key, disabled preview, and Worker JS/CSS parity checks on the exact main commit.

The local review receipt directory is not externally immutable; a privileged actor can delete an entire local store. An **actually independent off-host immutable anchor with protected source/reader keys remains an operational prerequisite**, not a capability supplied by these synthetic tests.

MASTER360-COMMS-QL432-HANDOFF | source=rosevear-comms-hub | host=DESKTOP-AE894KC | ql430=EXACT_PRIVATE_ACCEPTED_RECORD_REQUIRED | ql431=RECONCILED_SIGNED_OFF_CHECKPOINT_REQUIRED | external-anchor=REAL_INDEPENDENT_SIGNED_PIN_AND_DISTINCT_SIGNED_READBACK_REQUIRED | challenge=FRESH_BOUND_NONCE | original-host=SIGNED_OFF_REVALIDATION_REQUIRED | independent-receiver=FRESH_SIGNED_OFF_REQUIRED | master-disposition=THREE_DISTINCT_SIGNED_REQUIRED | owner-review=DUAL_SIGNED_HOLD_ONLY | connection=HOLD | receiver=OFF_UNTIL_NEW_CEREMONY | slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | CI=SIMULATED_NO_LIVE_ANCHOR

**Next proposed QL-433 — Independently Anchored Recovery Decision Export, New-Ceremony Authorization Boundary & Original-Host Pilot Re-entry Evidence Continuity.**
