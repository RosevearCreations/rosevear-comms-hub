# QL-428 — Externally Anchored Recovery Closure Evidence, Independent Custody Drift Recheck & Owner Supervised Pilot Re-entry Decision

## Code scope and operational truth

QL-428 follows QL-427's independently witnessed, dual-owner accepted incident recovery. It adds an **off-host external anchor proof protocol**, independently signed fresh remote custody readback, fail-closed local-to-remote digest comparison, and a supervised **re-entry precheck only** that requires another fresh signed receiver-OFF proof, three independent Master signatures and dual owner/reviewer signatures.

**This is code and CI only.** It does NOT configure an external append-only store, create a remote anchor, configure real keys, install a scheduler, interact with Windows, start the receiver, or certify CONNECTED. The owner must verify the separate host ceremonies and signers on actual devices. Code GREEN is not operational CONNECTED.

## Protected operator procedure

1. On the protected backend, reopen the original QL-426 hash-linked checkpoint store and QL-427 durable recovery closure store. Independently authenticate the QL-427 recovery acceptance, not just a browser boolean. Verify exact original-host source, episode, source/controller SHA revisions and incident.
2. Invoke **prepareQl428ExternalClosureAnchor**. Its sanitized export includes exact scope, incident, QL-426 OWNER_ACK checkpoint index and digest, QL-427 closure record/payload digests, and preparation timestamp. This is explicitly a **proposal** and not proof that an external anchor was stored.
3. An independently administered, append-only, **off-host** store must retain the signed anchor with the matching digests and a monotonic external sequence. A separate off-host readback signer must serve a signed, fresh readback for a unique unpredictable protected request ID; both independent Ed25519 public keys must be pinned separately in protected custody. Neither key is supplied by browser or CI. A signed claim of remote durability is only as trustworthy as verified external-store administration.
4. Invoke **recheckQl428IndependentCustody** against the actual remote read-only adapter. It checks *both signatures*, scope/incident/revisions, expected external store ID, anchor ID, checkpoint and closure digests, external sequence, remote durability, nonce and readback freshness. Then it opens the local QL-426/427 stores **again after the remote call**. Any alteration, absent data, read failure, replay, stale readback or mismatch => HOLD. A good result is only INDEPENDENT_EXTERNAL_CUSTODY_MATCHED; it never authorizes receiver activation.
5. For a proposed new isolated pilot, invoke **decideQl428SupervisedPilotReentry** in a protected original-host operator session. It performs **another independent external recheck**, requests a fresh independently pinned signed receiver-OFF report tied to this re-entry ID and remote anchor, and verifies three distinct signed Master prechecks and separate dual owner/reviewer signatures for action PREPARE_NEW_SUPERVISED_CEREMONY_KEEP_RECEIVER_OFF.
6. Successful decision creates an immutable private one-use fsynced re-entry **precheck receipt**, not a command. Result SUPERVISED_REENTRY_PRECHECK_RECORDED_NO_ACTIVATION keeps receiver OFF, connection HOLD, slave gate HOLD. A real subsequent pilot requires a **fresh QL-424 original-host supervised one-TEST ceremony** with independent physical and protected cryptographic acceptance; the prior recovered incident cannot be reused as activation authority.
7. Anchor and decision receipt digests should themselves be recorded in independently witnessed immutable custody to mitigate privileged tail deletion or original-host compromise. Actual remote storage, external reader signer enrollment, Windows receiver adapter, operator protection and monitoring schedule are **deployment dependencies not delivered by this build**.

## Fail-closed cases covered by CI

Missing independent verified authority, forged external anchor, forged independently signed readback, wrong external store, duplicate/old challenge, wrong digest, stale receipt, remoteDurable=false, data drift during external call, receiver ON/missing/foreign signer, wrong re-entry scope or incident, missing/duplicate Master, owner/reviewer forgery, owner activation request, and duplicate durable precheck all return HOLD. Key material in CI is temporary synthetic test-only Ed25519 data.

The QL-428 protected master audit workflow runs the new tests alongside QL-417 through QL-427, and normal app, Windows encrypted owner-key checks and public-worker asset parity remain in force.

MASTER360-COMMS-QL428-HANDOFF | build=QL428 | source=rosevear-comms-hub | original-host=DESKTOP-AE894KC | local-ql426-ql427-chain=PROTECTED_READBACK_REQUIRED | external-anchor=OFF_HOST_INDEPENDENT_STORE_REQUIRED | independently-pinned-anchor-and-reader=REQUIRED | receiver-OFF=fresh-new-reentry-signature-required | three-Master=independent-fresh-prechecks-required | owner=dual-signed-precheck-only | supervisor-reentry=NEW_QL424_CEREMONY_REQUIRED | connection=HOLD_UNTIL_INDEPENDENT_RUNTIME_PROOF | receiver=OFF_UNTIL_NEW_CEREMONY | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | runtimeUptime=UNKNOWN

**Next proposed build: QL-429 — Protected External Anchor Enrollment, Original-Host Fresh Challenge Orchestration & Independent Three-Master Pilot Re-entry Witness.**
