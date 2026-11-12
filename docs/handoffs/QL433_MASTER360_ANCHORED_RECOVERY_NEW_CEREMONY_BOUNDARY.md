# QL-433 — Independently Anchored Recovery Decision Export, New-Ceremony Authorization Boundary & Original-Host Pilot Re-entry Evidence Continuity

## Purpose

QL-433 is a **protected, Node-only, non-activating** checkpoint and authorization precheck for the **next new** QL-429/430 owner-supervised isolated pilot ceremony after QL-432 has accepted a signed, reconciled OFF incident. It is NOT permission to restart QL-431's terminated ceremony, enable a receiver, claim general CONNECTED, or establish uptime. All QL-433 success outputs retain **connection=HOLD**, **receiver=OFF_VERIFIED_SIGNED_READBACK**, and **slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE**.

No real original-host Windows adapter, external independent anchoring service, private Ed25519 signer, scheduler, or active receiver is shipped. All GitHub CI tests are synthetic.

## Protected, independently witnessed sequence

1. On original host **DESKTOP-AE894KC**, the protected backend must independently reopen and verify the exact QL-432 owner review private one-use receipt and the QL-431 append-only RECONCILED record for the same incident, index and checkpoint digest. Its runtime caller must also independently validate the actual signed QL-432 decision, not take a browser status as authority. Both original and next source/controller revisions remain exact, and proposed **nextCeremonyId** and **nextEpisodeId** must differ from the previous ceremony and episode.
2. Create a new challenge nonce and export ID; prepare a sanitized QL-433 recovery decision export containing the previously pinned QL-431 checkpoint index/digest, the QL-432 owner-review receipt, QL-432 external-anchor and independent readback digests, original signed scope, proposed next ceremony/episode IDs, exact original machine ID and the explicit **PRECHECK ONLY** action. Export creation does NOT mean it has been externally witnessed.
3. An independently protected **off-host external immutable store** must sign the exact decision export digest, next ceremony/episode, challenge nonce and prior custody digest. A **separately pinned independent reader** must sign a fresh readback bound to that anchor digest and export/nonce. Do not substitute two signatures from one key or local GitHub tests for an actual remote immutable store.
4. Read a **new original-host signed OFF response** from DESKTOP-AE894KC, bound to the exact original incident, external anchor, independent readback, next ceremony/episode and challenge nonce. A second, differently pinned **independent receiver** must sign an OFF observation no earlier than that response. A purported ON, stale, forged or TEMPLAR-host response fails closed.
5. Collect three distinct **fresh signed Master new-ceremony precheck** reports from rosevear-ai-hub, rosevear-comms-hub and ai-data-platform. Their status must be NEW_CEREMONY_PRECHECK_ONLY_RECEIVER_OFF and they must reference the same receiver proof, QL-432 receipt, independent anchor readback, next ceremony and next episode.
6. Distinct owner and reviewer must independently sign the exact ordered three-Master digest with decision **AUTHORIZE_NEW_CEREMONY_PRECHECK_ONLY_RECEIVER_OFF_NO_ACTIVATION**, fully bound to original incident, external evidence, new IDs, source/controller revisions and nonce.
7. Reopen original QL-432 and QL-431 private receipts immediately before recording an **exclusive one-use** incident authorization. A protected absolute directory, restrictive filesystem permissions, immutable receipt, file/directory fsync and signed digest readback are required. A repeated incident review or tampered receipt must fail closed.
8. The only accepted result is DURABLE_QL433_NEW_CEREMONY_PRECHECK_ONLY: the operator may proceed to **separate new** QL-429/430 supervised authority and proof enrollment. This QL-433 module itself never calls enableOneTest, disableOneTest, signs an activation or issues a general CONNECTED transition. Original source remains HOLD.

## Verification and limitations

Negative tests explicitly cover wrong prior QL-432 receipt, mismatched QL-431 checkpoint, forged off-host anchor or independent reader, wrong/replayed nonce, stale signed readbacks, non-original host, receiver ON, forged OFF, three-Master missing/duplicate/forged evidence, forged/absent dual-owner consent, attempted activation through precheck action, repeated incident and tampered local receipt. Gate on the full protected evidence workflow, application build, Windows original-owner key CI and production public Worker JS/CSS asset parity.

Local one-use custody alone cannot protect against privileged deletion of its entire directory. Actual independent immutable anchoring, real original-host signer custody and Windows receiver state must be established in the supervised environment; GitHub delivery does not do so.

MASTER360-COMMS-QL433-HANDOFF | host=DESKTOP-AE894KC | ql432=OWNER_REVIEW_DURABLE_EXACT_RECEIPT_REQUIRED | ql431=RECONCILED_SIGNED_OFF_CHAIN_REQUIRED | proposed-new-ceremony=DIFFERENT_CEREMONY_AND_EPISODE | external=INDEPENDENT_IMMUTABLE_SIGNED_DECISION_AND_DISTINCT_SIGNED_READER | original-host=FRESH_SIGNED_OFF | receiver=FRESH_INDEPENDENT_SIGNED_OFF | masters=THREE_DISTINCT_SIGNED_PRECHECK_REPORTS | owners=DUAL_SIGNED_PRECHECK_ONLY | authorization=NO_ENABLE_NO_RESTART | connection=HOLD | slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | CI=MOCKS_ONLY

**Next proposed QL-434 — Protected New-Ceremony Evidence Consumption, Independently Signed Authority Handoff & Original-Host Supervised Re-entry Readiness.**
