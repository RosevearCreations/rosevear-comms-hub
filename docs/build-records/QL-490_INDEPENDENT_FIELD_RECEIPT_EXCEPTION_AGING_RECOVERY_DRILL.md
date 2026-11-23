# QL-490 — Independent Six-Source Field Receipt Readback, Exception Aging & Owner-Supervised Recovery Drill

## Safety and current evidence status
QL-490 independently **reads and hashes** the private QL-489 metadata journal instead of trusting the QL-489 summary alone; it crosschecks the QL-486 signed source-registry readback, separately tracks six sources, and ages only explicitly operator-signed exception-open cases. It does not reverify the older original source or Windows signatures because QL-489 stored their digests, not the signature envelopes. No code-only result establishes a real production source or physical original-Windows identity. No live source, provider, customer data or Windows service is changed by this release.

QL-490 recovery is an offline tabletop rehearsal only. It requires an original Ree interactive Windows session, two distinct independently pinned Ed25519 signers bound to the exact readback digest and source, a fresh signed expiration window, stable before/after evidence, and durable replay-protected private receipt. It never performs an actual restore, restart, network request, enrollment, customer send, source write, Git merge or grant.

## Owner-local preparation
Use the existing QL-489 owner-private trust JSON file, same QL-486 registryDirectory, evidenceDirectory, pinned six-source trust and exceptionPins. Place an additional private JSON file containing a JSON array of signed QL-490 exception-open envelopes (`[]` when none). Each envelope has `payload` and Ed25519 `signature`; the payload is exactly:

`{schema:'rosevear.comms.ql490.signed-exception-open.v1',caseId,sourceId,captureRecordDigest,reasonCode,operatorId,openedAtMs,deadlineAtMs,customerDataIncluded:false,authorityTransfer:false}`

Both timestamps are Unix milliseconds. Deadline can be at most 7 days after opening. Only signed open cases are aged; a capture by itself is not an exception. QL-489 closed cases absent from the submitted open-case inventory remain flagged as unmatched. Exceptions close only via QL-489's separate dual-signed closure; a QL-490 review never closes them automatically.

## Commands (on original Windows machine DESKTOP-AE894KC in Ree profile, Node 22+)

`node .\runtimes\master-discovery\ql490-original-host-cli.mjs --status`

`node .\runtimes\master-discovery\ql490-original-host-cli.mjs --readback "<absolute-Ql489-config.json>" "<absolute-signed-open-cases.json>"`

`node .\runtimes\master-discovery\ql490-original-host-cli.mjs --drill "<absolute-Ql489-config.json>" "<absolute-signed-open-cases.json>" "<absolute-two-signed-drill-approvals.json>"`

The drill approval file is `{sourceId,ownerPacket,reviewerPacket}`. Both packets contain distinct Ed25519 signatures using the already independently pinned `exceptionPins[sourceId]` operator and reviewer public keys. Payload fields are exactly:

`{schema:'rosevear.comms.ql490.owner-supervised-recovery-drill.v1',drillId,sourceId,readbackDigest,expectedCaptureDigest,mode:'PRIVATE_OFFLINE_REHEARSAL',requestedAction:'VERIFY_RECOVERY_STEPS_NO_SEND',role:'owner'|'independent-reviewer',actorId,issuedAtMs,expiresAtMs,customerDataIncluded:false,authorityTransfer:false}`

Use the same `drillId`, `sourceId`, `readbackDigest`, `expectedCaptureDigest` and requested action in both packets, but distinct signer identities/roles. `expectedCaptureDigest` is the current source `lastCaptureDigest` or `null` when missing. The signatures expire within five minutes; each must be issued within two minutes of rehearsal. These approval packets must be generated and stored in the original owner-private directory, never Git, chat or the public site.

## Acceptance
- Six-source hash chain independent readback detects truncation, edits, cross-source closure, stale/missing QL-486 receipts and mismatched custody head.
- Signed operator OPEN case ages and QL-489 closure dispositions are compared without treating every capture as an incident.
- Original Windows `--status` is inert on CI; supervised drill denies wrong roles, stale signatures, replay, changed readback, and nonoriginal host.
- CI Linux/Windows and post-merge Worker parity must be GREEN on the exact `main` commit.
- True original-host field certification remains HOLD until real evidence is separately obtained and independently reviewed.

**Next proposed:** QL-491 — Durable Exception Intake Reconciliation, Original-Host Signed Field Proof Follow-Up & Independent Recovery Drill Trend Review.
