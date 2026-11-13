# QL-444 — Independent Signed OFF Continuity Watch, Lease-Exception Remediation Custody & Owner-Gated Three-Master Incident Closure

## Trust boundary

QL-443 code-green recorded a **historical evidence custody result**, not a current physical device state. QL-444 consumes exact protected QL-443 PENDING + ADMITTED or EXCEPTION receipts and original signed OFF renewal. It validates a subsequent, **new two-sample independent OFF continuity watch**, with signed original Windows host continuity and bounded clock skew. No hardware receiver actuator or CONNECTED transition is implemented.

Even the positive \`DURABLE_QL444_WITNESSED_OFF_INCIDENT_EVIDENCE_CLOSED\` and \`DURABLE_QL444_REMEDIATED_LEASE_EXCEPTION_EVIDENCE_CLOSED\` results are **incident evidence closure only**. Every outcome preserves:
- \`connection=HOLD\`
- \`activationAuthorized=false\`
- \`physicalReceiverCurrentlyOff=false\` (historical signatures do not guarantee live state)
- \`receiver=UNKNOWN_FRESH_EXTERNAL_OFF_REQUIRED\`
- \`manualIsolationAndIndependentOffRequired=true\`
- \`slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE\`

No model test or GitHub GREEN status is evidence that original host **DESKTOP-AE894KC** has physically reported OFF. QL-444 must receive genuine independently pinned hardware/signer evidence to reach a real signed evidence admission.

## Protected ceremony

1. Read back the exact QL-443 private one-use **PENDING and ADMITTED or EXCEPTION** receipts and verify they match the QL-443 signed result summary. Missing, contradictory or tampered receipts immediately HOLD.
2. Verify protected original-host session, independently verified QL-443 source, separate runtime key custody, trusted clock and fresh QL-444 continuity nonce (not the QL-443 renewal nonce). Do not ask the original host to energize a receiver.
3. Before any remote read, durably claim QL-444 private PENDING using exclusive 0600 creation in a 0700 absolute-path directory, file/directory fsync and exact readback. If interrupted, **no automatic replay**.
4. Read **signed QL-443 source** binding the exact QL-443 summary digest, previous protected receipt digest, disposition and timestamp.
5. Read the **previous original QL-443 receiver OFF renewal**, verify its Ed25519 signature and exact digest from QL-443, incident/lease/challenge identity, nonce, previous QL-442 decision digest and valid sequence/time.
6. Read **new signed host OFF-continuity proof**, specifically DESKTOP-AE894KC with watchdog armed, OFF receiver, exact previous independent OFF digest and strictly increasing sequence. Any TEMPLAR, OFF-to-ON change, watchdog de-arm, unsigned host evidence or sequence rewind fails closed.
7. Read **two fresh, separately signed independent OFF samples** under the new QL-444 nonce and watch ID, binding the QL-443 digest and host continuity digest. First sample must follow the host timestamp/sequence; second must follow the first signed digest and be at least 1 second later with strictly greater sequence. Missing/stale/mismatched independent observation fails closed.
8. For QL-443 **EXPIRED_EXCEPTION**, require a separate two-owner signed remediation receipt with cause/corrective evidence SHA-256, remediation ID, exact QL-443 exception receipt digest and second OFF watch digest. Owner and reviewer must be different independently pinned keys/identities, evidence must be recent and decision must preserve HOLD. Commit remediation under a **separate fsynced one-use REMEDIATION receipt**; incomplete remediation is not a completed closure.
9. For either path, require three distinct, fresh signed Master reviews from **Rosevear AI Hub, Rosevear Comms Hub and AI Data Platform**, all binding the exact QL-443 summary, second OFF watch digest and remediation digest (or null on on-time path). Each Master must explicitly approve **incident evidence-only closure, no CONNECTED/activation**. Conflicting, missing, stale, duplicated or forged Master decisions fail closed.
10. Require a final **two-owner** signed decision on the same source/watcher/three-Master digest and appropriate closure scope. Owner IDs and pinned signing keys must be distinct. No one Master or owner may unilaterally close an exceptional incident.
11. Re-read protected QL-443 custody and QL-444 pending/remediation receipts, freshness and absence of a prior CLOSED record. Commit a **one-use CLOSED evidence receipt** with fsync and immediate readback. On reboot, report historical evidence closure but do not assert current physical OFF, or authorize activation.

## Verification, release and handoff

- New module: \`runtimes/master-telemetry/ql444-off-continuity-incident-closure.mjs\`.
- Regression suite: \`runtimes/master-telemetry/ql444-off-continuity-incident-closure.test.mjs\`, synthetic Ed25519 identities only, positive on-time and remediated exception paths, altered or missing source, two-sample omissions and replay, sequence/timestamp regressions, wrong host, disarmed watchdog, forged Master reports, forged dual-owner signatures, broken custody, crash and replay.
- Protected CI includes QL-417 through QL-444; the unchanged main app/Windows security gates, Cloudflare Workers build and exact postmerge \`main\` JS/CSS SHA-256 parity remain release requirements.
- Full live-original-host hardware acceptance requires genuine independently witnessed OFF and separately enrolled original-owner custody; CI test signing keys and mock adapters cannot supply it.
- Master Instrument UI may show the protected incident evidence state, digest, independent observer, sequence continuity, exception age and owner closure stage. Do not paint a historic OFF as a current physical GREEN indicator.

## Next proposed build

**QL-445 — Independently Reconciled Post-Closure OFF Attestations, Recurrence Detection & Three-Master Operational Stability Review.**
