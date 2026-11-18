# QL-468 — Original-Host Worker Installation Readiness, Private mTLS Pilot, Safe Certificate Rollover, Independently Audited First ACK

## Release goals and exact safety state

QL-468 extends QL-467 without replacing the existing **sixteen shared Master theme** visual release already carrying this build label in \`main\`. Normal Comms source deployment remains independent of AI Hub and AI Data Platform.

**What is shipped:**
1. \`runtimes/master-telemetry/ql468-original-host-readonly.ps1\` provides a read-only, original-host-only Windows inventory: service presence/state/start mode/virtual service account match; old \`Rosevear AI Server Startup\` task disabled state; receiver port 8788 listener count. Returns HOLD. No secrets, task modifications, Windows SCM writes, reboot or Tailscale edits.
2. \`ql468-original-host-readiness.mjs\` implements distinct Ed25519 owner/witness signed **plan reviews** for a demand-start \`Rosevear-CommsHub\` service, pinned binary SHA-256, receiver-OFF witness digest and rollback plan. Even valid plans are \`SIGNED_INSTALL_PLAN_REVIEW_HELD\`, not an installation authority.
3. Same module checks independent dual-signed cert rollover proposals, different current/candidate **leaf SHA-256 and issuer-key** digests, 1–24h overlap, proposed cutover within overlap, still-valid old cert and 24h remaining candidate validity. An expired cert, reused key, overlapping window error or automatic cutover denies. No actual cert/key read or switch.
4. Same module validates signed original-host boot **claims**, and cross-reconciles a QL-467 original source event envelope, signed durable recipient \`RECEIVED\` ACK, different pinned independent auditor, exact digest/boot/tenant/message linkage and client TLS certificate fingerprint. All signatures can be verified from public pins; they **do not prove physical Windows origin or an independent live audit** without externally observed original-host evidence. \`firstAckAccepted\` and \`liveMtlsVerified\` therefore remain false.
5. \`ql468-loopback-mtls.test.mjs\` runs a **real cryptographic TLS 1.3 mutually authenticated local integration** with disposable CA/server/client certificates, a loopback-only ephemeral TCP port, isolated local receipts, verified signed ACK, exact replay, conflict and no-client rejection. This is **NOT** an original-host pilot or a running private production receiver. All test keys are ephemeral, deleted after the test, and never committed.

**Owner field acceptance still required before a host installation, reboot or private transport:** actual independent Windows host signed service/task inventory, service binary provenance, executable/service account, rollback/restart dependencies; original trusted CA and signed peer/issuer key enrollment; real certificate rotation overlap; verified source identity, receiver genuinely OFF, original-host supervised installation and post-boot observation; independently witnessed live TLS handshake and original \`RECEIVED\` ACK receipt/replay audit on source machine. No auto \`ql340c-windows-operator.ps1 -Start\`, no service autostart, no hidden activation. Keep the obsolete Windows Startup scheduled task disabled.

## Safe owner inventory (no installation)

From a local PowerShell terminal on **DESKTOP-AE894KC** (not a remote runner), after reviewing the source:

\`\`\`powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql468-original-host-readonly.ps1 -Mode Inspect
\`\`\`

The report is inspection data, not accepted proof: \`privateReceiverOffVerified=false\`, \`independentBootWitnessVerified=false\`, \`firstAckIndependentlyVerified=false\`. Do not paste private keys, certificate private material, database URLs or raw customer payloads into GitHub.

## Safety, test and operational closure

Mandatory \`scripts/ql336a-required-gates.sh\` runs both QL-468 negative signature/expiry/scope tests and the separate isolated local TLS 1.3 mutual authentication test. \`scripts/__tests__/ql336a-ci-topology.test.mjs\` asserts their presence after QL-467 while retaining the exact fingerprint of all original 43 safety checks.

Production code can be GREEN after protected \`main\`, application CI, protected audits, Cloudflare Worker build and **public asset SHA-256 parity**; original-host installation, real TLS pilot, independent audit and live first ACK remain **HOLD** until independently observed.

**Next proposed QL-469:** Original-host witnessed service enrollment and real independent peer receipt acceptance, only through separately owner-approved private field steps after signed certificate custody.
