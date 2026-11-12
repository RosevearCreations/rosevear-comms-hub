# QL-424 — Supervised original-host authority, protected receiver activation & three-Master operational acceptance

## Architecture and safety

QL-424 adds three protected Node-only functions in `runtimes/master-telemetry/ql424-supervised-activation.mjs` and an append-only ceremony ledger. It does **not** install a listener on Ree's Windows PC, configure network transport, send communications, execute Windows recovery, or call a receiver in production at deployment time. Tests use generated Ed25519 keys, a local temporary ledger and a mock receiver adapter. An app deployed to `main` is not an authenticated operation or evidence of CONNECTED.

### 1. Original Ree-host authority enrollment

`enrollQl424OriginalHostAuthority(certificate, trustedOptions)` checks a bounded dual-signed enrollment certificate from a distinct owner and reviewer. The certificate binds `rosevear-ai-hub`, original `DESKTOP-AE894KC` (not TEMPLAR), exact source and AI Data controller revisions, the Ed25519 source public SPKI, its SHA-256 fingerprint, separate owner and reviewer identities, and a fresh enrollment ID and time. The **expected** SPKI fingerprint and owner/reviewer public signing pins must be obtained through independent, trusted custody—not from the certificate or browser. An append-only, permission-restricted, write-exclusive ledger commits the one-use enrollment ID and verifies readback. It stores no private keys. State `SUPERVISED_SOURCE_PUBLIC_PIN_ENROLLED` means a protected public pin **could** be enrolled by the backend if actual custody exists; it is not proof enrollment happened on the real host.

### 2. Protected receiver activation ceremony

`runQl424SupervisedReceiverCeremony` is an explicit, one-use asynchronous call requiring:
- Protected operator session and independently witnessed receiver and enrollment custody.
- A fresh, dual-Ed25519-signed owner/reviewer request with exact source/episode, source/controller revisions, QL-423 durable custody digest, original signed decision ID, source enrollment ID and `ISOLATED_ONE_TEST` mode. Explicit intent `EXECUTE_ISOLATED_ONE_TEST_CEREMONY` is mandatory.
- Re-execution of the real QL-423 protected verifier with independently pinned Master, receiver and owner keys; signatures, replay restoration, original-host custody and QL-422 evidence must all be valid.
- A durable one-use activation claim before attempting the protected backend receiver adapter. The adapter must expose `enableOneTest`, `readSignedState` and `disableOneTest`. A separately pinned receiver Ed25519 key must sign a fresh exact source/episode/revision-bound `ISOLATED_ONE_TEST_ON` state readback. Failed state readback triggers best-effort disable; a failed rollback remains an explicit manual recovery HOLD.
- No production adapter is configured or executed by QL-424 CI or GitHub deployment.

An independently successful ceremony yields `ISOLATED_RECEIVER_ACTIVATED_PENDING_THREE_MASTER_ACCEPTANCE`, never general connectivity, customer routing, master ownership or full production acceptance. All receiver enablement must be owner-supervised through an isolated backend. Opening an app page does not trigger this function.

### 3. Verified three-Master operational acceptance

`verifyQl424ThreeMasterAcceptance` requires a live, fresh, signed receiver readback and **three separately Ed25519-signed** pilot attestations bound to exactly the same ceremony, original Ree-host episode, source/controller revision, durable custody digest and isolated receiver state. Signers are independently pinned for:
- Rosevear AI Hub — original source
- Rosevear Comms Hub — operator/communication master
- AI Data Platform — monitoring/intelligence controller

A distinct owner and independent reviewer must dual-sign a fresh final acceptance record containing the hash of the exact three reports. Only such genuinely authenticated runtime evidence can yield `VERIFIED_THREE_MASTER_ISOLATED_PILOT_ACCEPTANCE` with `VERIFIED_CONNECTED_PILOT`. This state still **does not imply all six apps are onboarded, general receiver mode is enabled, measured uptime is healthy, or the slave gate is released**. The default from code release alone remains `receiver=OFF`, `connection=HOLD`, `ownerAcceptance=HOLD`, `runtimeUptime=UNKNOWN`.

The protected implementation presumes the backend supplies actual independently pinned keys, an isolated receiver adapter with its own authorization, and tamper-resistant ledger persistence. Fake attestation flags, copied browser keys, arbitrary unsigned digests, test fixtures, and CI statuses cannot qualify.

### QL-333 six-source discovery correction

An unrelated delayed QL-333 scheduled source-discovery check had reported a failure because **all six unauthenticated public GitHub immutable-commit requests were unavailable**, despite the local manifest schema/security tests passing. `runtimes/master-discovery/audit-result.mjs` now distinguishes **transport unavailable** as `ci=PASS, operational=HOLD` from actual source/security `DENY`, missing/duplicate identities or CONNECTED claims (all `ci=FAIL`). It prints an explicit warning and lists deferred sources. This does **not** certify the six sources as discovered or connected. The change prevents an environmental public-network outage from being misreported as a failed local code contract, without suppressing security failures.

## Direct instructions to AI Data Platform

Source revisions observed during authoring: AI Data Platform production `ce4216c667b514f40e2fb6e506e5b62c222b1736` (Build 379 hotfix) and Rosevear AI Hub production `b790adf2e19343d1132fad0eef8107c21e3e560d` (Build 313). Reconcile current heads again before any operational ceremony.

`MASTER360-COMMS-QL424-HANDOFF | source=rosevear-comms-hub | controller=ai-data-platform | host=DESKTOP-AE894KC | independent-source-SPKI-pin=REQUIRED | owner-and-reviewer-dual-signature=REQUIRED | QL423-original-source-receiver-master-replay=REQUIRED | activation=ONE_USE_ISOLATED_SUPERVISED_ONLY | signed-receiver-state-readback=REQUIRED | three-independent-Master-pilot-attestations=REQUIRED | final-owner-independent-reviewer-acceptance=REQUIRED | live-original-host-telemetry=NOT_OBSERVED_IN_CI | installed-release=NOT_VERIFIED | runtime-uptime=UNKNOWN | receiver=OFF_UNTIL_ACTUAL_PROOF | connection=HOLD_UNTIL_ACTUAL_PROOF | slave-gate=HOLD_NEXT_MASTER_INTEGRATION_STAGE | no-Windows-recovery | no-private-key-posting`

**Next proposed QL-425 — Protected Pilot Health Continuity, Automatic Fail-Closed Rollback Monitoring & Three-Master Operator Runbook Verification.**
