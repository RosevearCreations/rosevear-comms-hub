# Rosevear Comms Hub QL-443 / Cross-Master 390
## Protected Shutdown Custody Admission, Expired-Lease Exception Handoff & Three-Master Fresh OFF Readback Renewal

This implements the **communications/original-host custody side** of the AI Data Platform Build 389 / QL-442 evidence-evaluation contract. The owner-supplied "390 / QL-443" label refers to the cross-Master rollout sequence; it does not alter the existing Comms Hub QL revision or renumber earlier Comms builds.

### Trust boundaries and runtime truth

QL-441 code GREEN means **synthetic verification passed**, not that a real physical receiver was switched ON or OFF. AI Data Platform QL-442's `SIGNED_OFF_PILOT_CLOSURE_READY_FOR_DURABLE_ADMISSION` means signed data can be submitted for protected review; it is **not** a persisted original-host closeout. QL-443 must not fabricate the missing external receipts. Hardware actions remain on the independently authenticated original Windows host and its separate receiver observer. No physical actuator, automatic connection, external messages, tokens or secrets are introduced here.

Every output, including a successful durable evidence admission, carries `connection=HOLD`, `activationAuthorized=false`, `physicalReceiverCurrentlyOff=false`, `receiver=UNKNOWN_REQUIRES_FRESH_EXTERNAL_OFF`, `manualIsolationAndIndependentOffRequired=true`, and `slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE`. Green code never overrides an expired-lease exception or a new safety observation. This design cannot close an *actual* physical pilot without separately authenticated, current ON/OFF and host enforcement evidence.

### Protected original-host QL-443 procedure

1. Start from the **exact QL-441** private signed and durable PENDING + DECISION records, challenge ID, incident ID, lease ID, originally signed independent ON hash and observed lease expiry. Signer identity and original-host lease binding cannot be swapped. The QL-441 decision must remain HOLD / no activation.
2. Require a protected original-host session on **DESKTOP-AE894KC**, a separately verified source/custody channel and trustworthy clock. Original host and all other participants have distinct independently pinned Ed25519 signing keys. Windows machine `TEMPLAR` cannot stand in for the original host.
3. Before doing any external intake, commit a private one-use QL-443 PENDING ledger receipt with incident ID, exact QL-441 decision hash, original independent ON digest and a new renewal nonce. The protected directory requires an absolute path, 0700 mode, exclusive 0600 record creation and file/directory fsync. Interrupted or partially written receipts cannot be replayed or reinterpreted as successful closure.
4. Obtain fresh **Comms QL-441 original source signature** bound to an exact digest of the QL-441 summary and protected decision receipt. Never trust a UI-ready badge.
5. Verify **original-host signed OFF shutdown**: original incident/challenge/lease, prior independent ON digest, DESKTOP-AE894KC identity, signed lease continuity, armed watchdog, positive sequence and OFF state. Obtain **distinct independent historical receiver OFF** signed at or after host shutdown, sequence ≥ shutdown sequence, exact host digest.
6. Determine **ON_TIME vs EXPIRED_EXCEPTION** from original QL-441 lease against *both* host shutdown time and independent historical OFF readback time. A late observation cannot silently be promoted as on-time because a key is valid.
7. Obtain **independently pinned AI Data Platform QL-442 closure classification** signed in a new, narrow Comms intake envelope `rosevear.ql443.signed-ai-platform-ql442-closure-evidence.v1` binding the original QL-441 summary, Comms source proof, host OFF, independent OFF and previous QL-442 evidence digest. The QL-442 classification must exactly match the independently recomputed lease disposition. Without a genuine independent AI Platform signature, this gate remains HOLD.
8. Obtain a **new independent signed receiver OFF reading**, with a **fresh QL-443 renewal nonce**, exact incident/challenge/lease and AI Platform decision digest, prior host and independent OFF hashes, strictly increasing OFF sequence and a fresh observation timestamp. A reused historical OFF report, original-host-signed fake receiver report, stale clock or unverified PIN fails closed.
9. Require three separately pinned fresh `rosevear-ai-hub`, `rosevear-comms-hub`, `ai-data-platform` signed renewal reports. Each binds the same QL-442 digest and new independent OFF digest. On-time reports may approve **signed shutdown evidence admission only, no activation**. Late reports must say **keep expired lease exception open**. Missing, duplicate or conflicting Master reports fail closed.
10. Require two separate original owner/reviewer identities to sign the same canonical three-Master closeout digest and either `ADMIT_SIGNED_SHUTDOWN_EVIDENCE_ONLY_NO_CONNECT` or, if lease expired, `ACKNOWLEDGE_EXPIRED_LEASE_EXCEPTION_KEEP_OPEN`. Any signature mismatch, impersonation or CONNECTED claim rejects admission.
11. Re-read exact prior QL-441 private receipt and QL-443 pending custody before exclusive fsynced commit to `ADMITTED` or `EXCEPTION` (mutually exclusive). Reboot readback reports a historical admission or still-open exception, **never** the physical receiver's current state. Retain full audit digest chain and require separate live OFF recheck before genuine pilot closure.

### Outcomes

- `DURABLE_QL443_SIGNED_SHUTDOWN_EVIDENCE_ADMITTED`: durable signed *evidence* accepted; does not assert currently OFF, allow CONNECTED or close a physical pilot.
- `DURABLE_QL443_EXPIRED_LEASE_EXCEPTION_HANDOFF_OPEN`: signed late OFF is held as an **open lease exception**, not a pass or closed pilot.
- `HOLD`: external evidence missing, stale, forged, inconsistent, incomplete or custody corrupt. Prompt manual isolation review and new independent signed OFF proof.

### Test plan and release gates

`node --test runtimes/master-telemetry/ql443-protected-shutdown-custody.test.mjs` uses only locally generated synthetic Ed25519 keys, fake signed source/host/receiver/Master/owner envelopes and a temp private ledger; no Windows host or physical equipment is contacted. Positive on-time, late expiry and adversarial cases include tampering, source signature mismatch, absent original host, wrong machine, watchdog disabled, fake ON, OFF continuity rollover, missing historical and renewed independent OFF, stale nonce/timestamp, invalid AI Platform classification, duplicate Master, forged CONNECTED approval, owner key collision, interrupted custody, replay and corrupt ledgers.

Protected GitHub audit QL-417–443 plus application regression, Windows owner-key safety and production Cloudflare Worker deployment with **exact post-merge `main` SHA** public JS/CSS SHA-256 parity are required before calling this code release GREEN.

The existing navy/purple Master Shell theme remains unchanged. A later UI workstream may expose historical `HOLD`, signed source/observer IDs, lease expiry and custody hashes as clearly labeled **evidence only** rather than misleading live-status controls.

**Next proposed Rosevear Comms Hub QL-444 — Independent Signed OFF Continuity Watch, Lease-Exception Remediation Custody & Owner-Gated Three-Master Incident Closure.**
