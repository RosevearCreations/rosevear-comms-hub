# QL-427 — Independent Pilot Checkpoint Witness Export, Post-Rollback Receiver Isolation Assurance & Three-Master Recovery Closure

## Scope and operational truth

QL-427 extends QL-426's durable pilot health checkpoint and incident custody. It adds an independent external witness protocol, a separately pinned fresh receiver OFF verification after rollback and owner acknowledgement, and a one-use independently signed three-Master incident-recovery closure receipt.

This is protected Node-only functionality, not an automatic scheduled monitor, new transport, device activation, public administrative API, original-host Windows test, or live connection proof. **A green code release is not live original-host acceptance.** Default connection=HOLD, receiver=OFF/UNKNOWN unless separately verified, runtimeUptime=UNKNOWN, and slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE.

## Protected backend operator sequence

1. Reopen the actual private QL-426 checkpoint store using openQl426ProtectedCheckpointStore. Confirm the entire hash-linked chain and last OWNER_ACK checkpoint. Require independent QL-426 owner-ACK custody verification; a caller-supplied browser claim is not authority.
2. Call prepareQl427CheckpointWitnessExport in a verified protected operator session. This produces a bounded, metadata-only export: exact ceremony, source/episode, source/controller commit identities, owner-ACK checkpoint digest/index, incident ID, signed owner-ACK evidence digest, rollback checkpoint digest, and timestamp. It does NOT say the export has been witnessed or delivered.
3. An independent authorized witness outside the Comms Hub trust domain must verify that checkpoint independently and sign its exact exported digest with a separately pinned Ed25519 key. Call verifyQl427IndependentCheckpointWitness to validate the signed witness, exact source and incident binding, freshness, timestamp ordering, and independent pin. Keep the witness signing private key off the Comms Hub system and out of CI.
4. On the protected receiver backend, call checkQl427PostRollbackIsolation with a fresh isolation check ID. The receiver must return a new, separately signed OFF attestation bound to the same scope, incident, checkpoint digest, witness digest, and check ID. The attestation must postdate the OWNER_ACK and witness and be no more than two minutes old. Never infer OFF from a prior QL-426 adapter acknowledgement or from a build result.
5. Obtain three distinct signed recovery-closure reports from the original Rosevear AI Hub, Rosevear Comms Hub, and AI Data Platform. Each report binds that exact incident, source/controller revision, independently witnessed checkpoint and fresh OFF proof. Separately, distinct owner and independent reviewer must sign the exact ordered report digest with action ACCEPT_RECOVERY_CLOSURE_KEEP_RECEIVER_OFF.
6. Call acceptQl427ThreeMasterRecoveryClosure with the QL-426 store, witness result, isolation result, three signed reports, dual-signed acceptance, and protected QL-427 closure store. It commits a one-use metadata-only receipt with durable fsync and independent readback. Closing a recovery incident does NOT authorize resuming the isolated pilot, turning on the receiver, declaring CONNECTED, releasing the slave gate, or turning on Windows recovery.
7. Any future isolated test needs a new original-host signed QL-424 one-use ceremony and independently approved three-Master operational acceptance.

## Failure and security rules

- Missing/tampered QL-426 owner ACK, stale/forged/mis-scoped witness or wrong witness public key => HOLD.
- Signed receiver evidence unavailable, stale, mismatched, ON, replayed for another check ID, or signed by a different key => HOLD, receiver UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED.
- Missing or duplicated Master, wrong episode/incident/revision, reordered or tampered signature, wrong owner/reviewer public key, same owner/reviewer ID, or replay of closure receipt => HOLD.
- Confirmed closure => DURABLE_THREE_MASTER_RECOVERY_CLOSURE_RECORDED, receiver OFF_VERIFIED_SIGNED_READBACK and connection HOLD, not general CONNECTED.
- Closure receipt storage permissions and immutable write are protected. Privileged deletion can defeat a local-only disk journal: an external append-only witness or remote immutable record of the final closure digest is required to defend against catastrophic loss or privileged truncation. The external witness integration, remote store, scheduler, real receiver adapter and device signer enrollment are deployment dependencies, NOT implemented by this code release.

## Regression verification

The QL-427 test module generates isolated Ed25519 identities and mock backend receiver responses. Tests cover prepared-but-not-witnessed export, independent signature and freshness validation, correct post-rollback signed OFF attestation, forged/ON/mismatched isolation proof rejection, three independently signed Master closure and dual-signed owner/reviewer decision, replay-safe closure storage, and preservation of HOLD. CI extends the existing protected audit without weakening application, Windows key-safety, or production parity gates.

MASTER360-COMMS-QL427-HANDOFF | source=rosevear-comms-hub | original-host=DESKTOP-AE894KC | QL426-owner-ack-chain=INDEPENDENT_PROOF_REQUIRED | external-checkpoint-witness=SIGNED_PUBLIC_PIN_REQUIRED | receiver-isolation=fresh-signed-OFF-only | recovery-closure=THREE_INDEPENDENT_MASTERS_PLUS_DUAL_OWNER | closure-durable-ledger=BACKEND_CONFIGURATION_REQUIRED | host-telemetry=NOT_VERIFIED_BY_RELEASE | receiver=OFF_UNTIL_LIVE_PROOF | connection=HOLD_UNTIL_LIVE_PROOF | runtime-uptime=UNKNOWN | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | no-private-keys-in-CI

**Next proposed QL-428 — Externally Anchored Recovery Closure Evidence, Independent Custody Drift Recheck & Owner Supervised Pilot Re-entry Decision.**
