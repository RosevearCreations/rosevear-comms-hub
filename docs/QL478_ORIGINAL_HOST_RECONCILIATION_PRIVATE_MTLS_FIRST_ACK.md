# QL-478 — Original-host evidence reconciliation and authenticated private telemetry pilot

## Scope, actual benefit, and acceptance boundary

QL-478 implements a usable **owner-initiated private telemetry pipeline** instead of only a proposed signed-packet shape. It combines QL-476 original-host on-demand worker run receipts, QL-477 exported evidence, strict QL-478 SHA-256 readback, real mutually authenticated TLS 1.3 on a manually opened **127.0.0.1** socket, pinned Ed25519 sender signatures, a write-once local signed ACK, fsync + readback, anti-replay, and independent observer packet assessment. Synthetic CI exercises a real TLS handshake and real filesystem writes, but its keys, certificates and data are intentionally ephemeral. CI is NOT original-host or live remote-peering acceptance.

This build cannot install or secretly run on DESKTOP-AE894KC via GitHub. In particular, it does **not** switch on the old port 8788 receiver, register an SCM service, create triggers or reboot. It never transmits outside 127.0.0.1; this is the first local authenticated telemetry pilot, **not** a production network delivery to another application. Signed first-ACK audit still produces `THREE_SIGNED_SOURCES_REVIEW_HELD` because it cannot replace independent physical observation.

## New components

- `ql478-original-host-reconcile.ps1`: owner-only, read-only original Windows host verification of clean `C:\rc470` main, manual-only scheduled task, no legacy listener/auto-start, current worker hash, current QL-477 export freshness, both QL-476 receipt files SHA-256 and run/boot ordering. An explicitly approved reconcile command writes one private local review record; it never sends any packet.
- `ql478-private-pilot.mjs`: exported mTLS sink and **unbound** HTTPS server; no socket is opened until a caller explicitly invokes `listen`. Requires an independent enrolled host Ed25519 pin, receiver key, matching client X509 certificate leaf SHA-256, QL-477 redacted aggregate evidence, exact allowlist fields and five-minute envelope TTL. Success is one write-once, signed, independently read-back ACK. Duplicate message with identical signature returns the exact original ACK; different content for the same message ID returns conflict. Corruption returns HOLD.
- `ql478-owner-loopback-cli.mjs`: one-time owner-supervised original-host process. Validates private owner configuration, live original-host clean `main`, QL-477 export and QL-478 reconciliation report, exact signature-key and certificate pins, then opens a temporary TLS 1.3 **loopback** port, sends exactly one aggregate sample, checks the signed durable ACK and closes the port. Does not enroll other peers or schedule a future run.
- `ql478-evidence-reconciliation.mjs`: independent signed auditor packet can correlate the field digest, ACK digest, boot/source pins and certificate evidence; the outcome is signed claims reviewed, never physical acceptance.
- `ql478-private-pilot.test.mjs`: real ephemeral certificate-authority, server/client certificates, TLS1.3 connection, actual filesystem ACK, replay/corruption, no-client-cert, privacy and signature tests, plus independent auditor negative tests. The Windows parser and nonoriginal CI-host fence run separately in Actions.

## Actual original host procedure (requires owner and independent witness)

Only the original owner may choose to run these steps. Do not use CI artifact directories, public GitHub or chat to store original keys or exported evidence. Retain the prior disconnected backup and five existing source copies; QL-475 backup and independently witnessed full offline restore evidence remain prerequisites.

1. On DESKTOP-AE894KC, update the already clean primary checkout by fast-forward only: `git -C C:\rc470 pull --ff-only origin main`. Never reset or clean the historical clones.
2. Verify the QL-476 on-demand worker was really installed by an owner. Because each local run receipt is tied to the current `main` SHA, manually approve and verify **fresh original-host first and recovery runs for the new main SHA**, with no intervening reboot. The two signed physical observation claims must come from independent real keys and witnesses, not examples.
3. Run QL-477 `-Mode Export -ApproveLocalExport` while its evidence is fresh.
4. Run:
   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql478-original-host-reconcile.ps1 -Mode Inspect
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql478-original-host-reconcile.ps1 -Mode Reconcile -ApproveLocalReconciliation
   ```
5. In a private owner-controlled configuration JSON referenced by `QL478_TRUST_CONFIG`, provide **exactly** these properties: `ca`, `serverCert`, `serverKey`, `clientCert`, `clientKey`, `hostSigningKey`, `receiverSigningKey`, `hostSigningPin`, `receiverSigningPin`, `clientCertLeafSha256`, `evidenceJsonPath`, `reconciliationJsonPath`, `ledgerPath`, and `resultPath`. All private keys/certificates and both JSON reports must be in owner-only files under `%LOCALAPPDATA%` (never under the repository). Pins must have been established independently in advance; never trust pin values received inside the packet. Use a fresh, nonexistent result path. Do not commit this file or its contents.
6. Only if explicitly supervised and independently witnessed, with both pinned signer identities and TLS client certificate verified:
   ```powershell
   $env:QL478_TRUST_CONFIG = Join-Path $env:LOCALAPPDATA 'RosevearCommsHub\QL478\owner-trust.json'
   node C:\rc470\runtimes\master-telemetry\ql478-owner-loopback-cli.mjs --supervised-one-time-loopback
   ```

Stop on any HOLD; don't bypass a missing original-host witness, key custody or backup. The manual runner writes a local result marked `LOCAL_REAL_TLS13_ACK_CORROBORATED_INDEPENDENT_FIELD_WITNESS_HOLD`. This proves one **local** TLS/ACK exchange if collected from the real original host, not remote private receiver activation. Independently verify the result and keys before accepting live production transport.

## Source promotion vs field status

Successful protected main CI/Cloudflare means **source release GREEN**, not physical host GREEN. Remain HOLD for (a) actual installation and first run on DESKTOP-AE894KC, (b) witnessed offline restore and physical recovery, (c) genuine production peer authorization and remote mTLS/ACK, and (d) independently certified first production telemetry receipt. No automatic receiver enablement or secrets are introduced. All four still require separately grounded field evidence. Avoid estimating large completion gains from source CI alone.
