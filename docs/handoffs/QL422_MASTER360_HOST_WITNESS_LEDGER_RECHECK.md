# QL-422 — Original-host closure witness reconciliation, durable three-Master handoff receipts & operator decision recheck

## Purpose and scope

QL-422 extends QL-421's source-scoped, read-only closure handoff model with explicit original Ree host witness evidence, independent three-Master ledger custody and an operator's supervised decision recheck. Its implementation is `runtimes/master-telemetry/ql422-original-host-witness.mjs` with negative and positive tests in the matching `.test.mjs`.

**The model is not a live receiver, signature verifier, scheduled Windows task, persistence mechanism or operator authorization endpoint.** It only reconciles bounded, protected metadata supplied after the backend independently authenticates each source, signer, witness, receiver ACK, ledger reader and owner/reviewer. The presence of booleans or SHA-256 checksums in a browser request is never proof.

## Reconciliation gates

1. **Original host only:** the witness must be sourced from `rosevear-ai-hub` on Ree's original Windows server `DESKTOP-AE894KC`; Jack's laptop is never an original-source candidate. The witness binds exact episode, source revision, controller revision, QL-421 closure digest, signed source receipt ID and digest, separately signed receiver ACK digest, and trusted witness time. Host identity, source signer, receiver ACK signature, replay admission and independent custody must be proved separately at the protected runtime. A 5-minute metadata freshness bound is applied.
2. **Durable Master ledger:** one independently signed and durable receipt for each `rosevear-ai-hub`, `rosevear-comms-hub` and `ai-data-platform`, correlated to the **same exact QL-421 handoff receipt ID**, closure digest, witness digest, source and controller revisions. A strictly ordered sequence and predecessor hash chain rejects missing, duplicated, reordered or tampered entries. Each durable commit and independent ledger readback must be authenticated at the backend. A hash chain is tamper-evident **within accepted metadata**; it cannot establish actual restart persistence on its own.
3. **Operator decision recheck:** independent, distinct owner and reviewer, durable decision custody, prior QL-421 owner audit digest, witness digest and terminal Master ledger digest are all required. `REQUEST_SUPERVISED_ACCEPTANCE` can become **READY_FOR_SUPERVISED_OWNER_RECHECK_NOT_ACCEPTED** only with complete QL-421 readiness and all three ledger entries. `REOPEN` or `CONTINUE_HOLD` never releases the gate.
4. **Fail closed:** absent or stale proof, source/episode mismatch, unsigned custody, invalid digest, duplicate ID or replay, Windows host mismatch, missing ledger entries and unauthorized operator decisions never transition the receiver or connection to active. The model always reports receiver **OFF**, connection **HOLD**, owner acceptance **HOLD**, slave onboarding **HOLD**, and original-host uptime **UNKNOWN** unless separate authenticated runtime proof exists outside this projection.

QL-422 does not install software on Ree's server or execute Windows recovery, and does not publish private keys, credentials, raw original signed envelopes or customer/device secrets. `main` CI GREEN proves **only** the code release.

## Master360 controller coordination

Current baselines are not immutable runtime proof; reconcile GitHub main heads again before taking operational action. At authoring, AI Data Platform controller Build 376 main was `b1273edf4b2b38b5ca68371d9b171a1391d6f2f6` and AI Hub Build 310 main was `c090a9f00a82e20b0a799ad99423153d20eea7b4`.

`MASTER360-COMMS-QL422-HANDOFF | source=rosevear-comms-hub | controller=ai-data-platform | contract=rosevear.ql422.original-host-witness-ledger-operator-recheck.v1 | reconcile-current-main=REQUIRED | ree-host=DESKTOP-AE894KC | source-signer=INDEPENDENT_AUTH_REQUIRED | receiver-ack=INDEPENDENT_SIGNATURE_REQUIRED | durable-replay=EXTERNAL_COMMIT_READBACK_REQUIRED | three-master-receipts=SOURCE_REVISION_AND_DIGEST_BOUND | owner-review=SEPARATE_OWNER_AND_REVIEWER | receiver=OFF | connection=HOLD | original-host-uptime=UNKNOWN | owner-acceptance=HOLD | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | do-not-activate-from-code-green`

**Next proposed QL-423 — Original-Host Signed Receipt Custody Intake, Three-Master Replay Restoration and Protected Operator Activation Decision.**
