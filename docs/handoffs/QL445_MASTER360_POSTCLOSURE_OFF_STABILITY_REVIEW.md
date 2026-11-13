# QL-445 — Independently Reconciled Post-Closure OFF Attestations, Recurrence Detection & Three-Master Operational Stability Review

## Scope and safety

QL-445 is the **Rosevear Comms Hub** evidence-coordination stage after QL-444. It audits whether freshly signed original-host and independent receiver observations remain consistent after a historical incident-evidence closeout. It does not drive receivers, enroll authentic signing keys, or permit another shell to inherit local runtime authority.

**All outcomes remain \`connection=HOLD\`, \`activationAuthorized=false\`, \`physicalReceiverCurrentlyOff=false\` and \`manualIsolationAndIndependentOffRequired=true\`.** Two verified historical OFF samples do not guarantee the device is physically OFF right now. Production-code GREEN is not an original-device signed proof.

## Signed, source-bound procedure

1. Verify the exact QL-444 final protected **PENDING + CLOSED** receipts and, for a remediated expired lease, the additional **REMEDIATION** receipt. They must match the QL-444 original incident, signed two-sample OFF witness digest, closure digest, separately signed three-Master report digest, and evidence-only HOLD/no-activation outcome. A missing, tampered or contradictory receipt fails closed.
2. Enter only through the independently verified original-host session and a trusted clock. Check pinned **distinct** Ed25519 identity keys for original Comms source, original Windows host **DESKTOP-AE894KC**, independent receiver observer, all three Master reporters and two owners. Synthetic test keys are not live enrollment.
3. Require a fresh QL-445 watch ID and nonce, distinct from QL-444. Durably claim a **one-use PENDING** record before any external evidence read; store it in a private absolute directory using exclusive 0600 files, 0700 directory, fsync of file and directory, and readback. An interrupted attempt is HOLD/non-replayable, never automatically resumed.
4. Obtain a freshly signed original Comms QL-444 source readback containing the exact protected QL-444 summary digest, closure receipt digest, prior second independent OFF sample digest and timestamp.
5. Obtain **two signed original-host post-closure probes**, strictly increasing sequences and timestamps, original machine DESKTOP-AE894KC, armed watchdog, exact signed QL-444 source and previous independent digest, and state **OFF or ON**. The second probe must be strictly later with a ≥1-second interval.
6. Obtain **two corresponding independently signed receiver observations**, each with an exact original-host probe digest, the correct previous independently witnessed receipt digest, monotonic sequence and fresh timestamp. Signed host/observer state disagreement is treated as **possible recurrence / HOLD**, never as stable OFF. No cached prior QL-444 OFF receipt may be silently reused as a new sample.
7. If both observers agree **OFF at both samples**, classify \`RECONCILED_HISTORICAL_OFF_STABILITY_ONLY\`; if both agree **ON at any sample**, classify \`SIGNED_ON_RECURRENCE_REOPEN\`. The latter **reopens an incident-risk evidence case**; it is not permission to switch or connect the receiver. A missing/forged/stale/different state fails closed, with manual isolation required.
8. Obtain **three distinct signed Master reviews** (Rosevear AI Hub, Rosevear Comms Hub, AI Data Platform) binding QL-444 closure receipt, both host and observer sample digests, exact stable/recurrence classification, and explicit \`ACCEPT_OFF_STABILITY_EVIDENCE_ONLY_NO_CONNECT\` or \`REOPEN_POSTCLOSURE_RECEIVER_INCIDENT_KEEP_HOLD\`. No Master is allowed to accept a contradictory source, missing independent OFF/ON, or claim CONNECTED.
9. Obtain **two independent original-owner and Master-owner signatures** on the same canonical report digest and exact classification/decision. Missing, duplicated, stale, owner-colliding, forged, or CONNECTED-granting signatures fail closed.
10. Re-read prior protected QL-444 custody and current QL-445 pending receipt. Exclusively commit a **STABLE** or **RECURRENCE** fsynced receipt with full digest chain. The two kinds are mutually exclusive. After reboot, readback reports a historical OFF evidence record or an open recurrence case, never the physical state.

## Durable outputs

- \`DURABLE_QL445_POSTCLOSURE_OFF_STABILITY_EVIDENCE_ADMITTED\` — independent signed post-closure OFF evidence passed three-Master and dual-owner review. Connection and runtime state still HOLD/unknown.
- \`DURABLE_QL445_SIGNED_ON_RECURRENCE_INCIDENT_OPEN\` — signed ON recurrence observed after historical closure; open a new supervised incident, keep HOLD and require fresh independent isolation/verification.
- \`HOLD\` — source, signatures, clock, sequence, custody, owners, Master consensus, or runtime identity could not be verified; for a signed state divergence, retain \`recurrenceSuspected=true\` and require new independent evidence.

## Regression and production checks

\`node --test runtimes/master-telemetry/ql445-postclosure-off-stability.test.mjs\` runs synthetic signer-only positive and adversarial tests for both stable and recurrence cases, remediated lease inheritance, wrong host machine, missing source, state disagreement, stale/forged independent samples, replay, wrong sequence, Master veto, owner collision, pending interruption and tampered private custody. The unchanged release gates remain authoritative: QL-417–445 protected evidence audit, full app build and QL-336A regression suite, QL-340 Windows protected-key safety, Cloudflare Workers production deployment and **exact postmerge \`main\` public JS/CSS SHA-256 parity**.

No live receiver OFF/ON ceremony is performed by CI or this module. The runtime owner must independently supply authenticated external evidence before any physical closeout or connection state change.

## Branch cleanup

Preserve \`dev\`, \`main\` and every unmerged or otherwise unknown branch. Deletion candidates must be verified against PR merge status and the branch's current exact head before any operation. When no authorized branch-delete/rename operation is exposed, file an explicit GitHub cleanup issue listing only verified merged branch names and SHAs; **do not invent deletion or rename success**.

**Next proposed QL-446 — Protected Post-Closure Recurrence Evidence Escalation, Multi-Horizon OFF Sampling & Owner-Gated Three-Master Reopening Decision.**
