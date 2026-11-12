# QL-423 — Original-host signed receipt custody intake, three-Master replay restoration and protected operator activation decision

## Scope and security boundary

QL-423 introduces a protected Node-only capability, `runtimes/master-telemetry/ql423-signed-custody-replay.mjs`, rather than a public API or Windows task. Three distinct functions cover admission, persistent custody readback, and supervised activation **review**. The deployment on GitHub `main` proves software release quality, **not** original Ree-host installation or live Master connectivity.

### 1. Original-Ree-host Ed25519 custody intake

`admitQl423OriginalHostCustody` takes the actual QL-411 original-host telemetry envelope and QL-414 separately signed receiver ACK, rather than accepting a digest or `verified=true` flag as sufficient proof. It checks:
- Source `rosevear-ai-hub`, host `DESKTOP-AE894KC`, exact independently pinned 40-character source revision, independently pinned controller revision and five-minute freshness.
- Native Ed25519 source signature over the original strict QL-411 metadata-only telemetry, and a distinct Ed25519 receiver signature over the strict QL-414 ACK.
- Exact episode/source/revision/source-payload SHA-256 binding between source and receiver; receiver ACK timestamp must follow source capture.
- Authenticated protected transport, independently enrolled public source/receiver pins, independently witnessed original-host custody, owner authorization and separate reviewer authorization.
- The full existing QL-411 schema and bounded sample validation **before** the protected durable store commits a one-time episode record.
- Replay rejection and mandatory post-write readback. An incorrect or unavailable store fails closed.

`openQl423DurableCustodyStore` opens a protected, absolute, directory-backed Node store with permission restrictions, exclusive creation (`wx`) and `fsync`, storing **only sanitized metadata plus a checksum** — never private keys, raw telemetry packets or signature envelopes. An independent protected reader can reopen the directory and inspect recorded custody after a restart. Deployments must supply a trusted non-shared directory and secure host-level permissions; this code does **not** provision that production directory automatically.

### 2. Three-Master replay restoration

`reviewQl423ReplayRestorationAndActivation` re-evaluates the exact QL-422 original-host witness, source episode and three-Master durable handoff ledger, then compares custody record digests loaded from the initial and independently reopened protected store. Separately signed Ed25519 restoration receipts are required from each of:
- `rosevear-ai-hub`
- `rosevear-comms-hub`
- `ai-data-platform`

Each must include source/episode/revision/controller revision, the original QL-422 ledger entry ID and digest, the protected source custody digest, and a fresh restoration checkpoint. Distinct independently enrolled Master public pins are supplied by a protected backend. A missing, duplicate, forged, stale, mismatched, or uncorrelated receipt holds the gate. Protected restart witnessing and independent reader custody are mandatory; **the function does not itself restart any host or manufacture a third-party signed receipt**.

### 3. Protected operator activation decision

An independently authorized owner and a **different** reviewer must both Ed25519-sign the same bounded operator decision metadata, exactly bound to the QL-422 terminal ledger digest and original protected source custody digest. Actions are `REQUEST_ACTIVATION_REVIEW`, `REOPEN` or `MAINTAIN_HOLD`. Only a complete authentic request can return `READY_FOR_SEPARATE_SUPERVISED_ACTIVATION_NOT_EXECUTED`.

**That state does not turn on the Comms receiver.** It is not owner acceptance, HEALTHY uptime, CONNECTED, a customer contact, or permission to run Windows recovery. Every function explicitly returns `receiver=OFF`, `connection=HOLD`, `ownerAcceptance=HOLD`, `runtimeUptime=UNKNOWN`, `slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`. Runtime activation requires a distinct owner-supervised implementation and genuine original-host operational proof.

The application owner panel is a static, fail-closed readiness view until independently verified protected runtime records are connected to it. Unit tests use temporary **generated** Ed25519 keys and local temporary directories, never production signer keys or real owner approvals.

## Direct Master360 handoff to AI Data Platform

At drafting, the observed GitHub production revisions are AI Data Platform Build 378 `a0eea834c7e8d62232a70b13b06688c6b9b4babc` and Rosevear AI Hub Build 312 `e64e4b2e79e7c07bbd077284c298207414b149ad`. Reconcile current heads again before using them for an operational decision. The source signer is expected **only** on Ree's original `DESKTOP-AE894KC`, not the reviewer laptop.

`MASTER360-COMMS-QL423-HANDOFF | source=rosevear-comms-hub | controller=ai-data-platform | contract=rosevear.ql423.signed-custody-replay-restoration.v1 | real-QL411-source-signature=REQUIRED | real-QL414-independent-ACK-signature=REQUIRED | original-ree-host=DESKTOP-AE894KC | protected-custody-store=RESTART_PERSISTENT_WRITE_AND_READBACK_REQUIRED | independent-master-restoration-signatures=ALL_THREE_REQUIRED | operator-signatures=SEPARATE_OWNER_AND_REVIEWER | decision=REVIEW_ONLY | production-code=NOT_RUNTIME_EVIDENCE | receiver=OFF | connection=HOLD | owner-acceptance=HOLD | uptime=UNKNOWN | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | no-Windows-recovery-execution`

## Next proposed build

QL-424 — Supervised Original-Host Authority Enrollment, Protected Receiver Activation Ceremony & Verified Three-Master Operational Acceptance.
