# QL-496 — Genuine First-Source Master Trial Endpoint Contract, Independent Original-Device Evidence Closure & Signed Delivery Reconciliation

## Truth boundary / deployment custody

QL-496 supplies a **non-listening contract implementation** for a *separately owned and deployed* Master-side HTTPS endpoint. The module **does not start a server**, enroll private keys, install a Windows service, create a source identity, open a firewall port, authorize customer writes, or certify a physical source. There is no configured live external Master endpoint in this build. A matching public Worker JS/CSS build is not a live Master service or evidence of connectivity.

The real operational ceremony remains HOLD until independently provisioned, source-owned production credentials and physical witness proofs exist. GitHub CI uses synthetic test keys, simulated sockets, and temporary ledgers that never establish operational authority.

### What is delivered

1. **Master-side private trial contract:** \`runtimes/master-discovery/ql496-master-endpoint-contract.mjs\` exposes \`QL496_PATH='/internal/comms/master-delivery-trial'\` plus \`observeQl496ActualMutualTls\`, \`validateQl496MasterEndpointTrial\` and \`createQl496MasterEndpointContract\`. A separately configured **HTTPS TLS 1.3 server** must require client certificates, validate CA/hostname and retrieve the actual peer certificate from its TLS socket. It must refuse forwarded client cert headers. The approved mTLS client fingerprint, Master signer public key, actual current QL-493 private audit and **original QL-494 signed source / owner / reviewer packets revalidated by QL-495** are required. Missing, stale, substituted, mismatched or empty source evidence => HOLD. The module accepts an actual Node \`IncomingMessage\` and exact QL-495 metadata envelope but **does not implement \`https.createServer\` or install a network route**. No endpoint may be advertised as live until the Master service owner separately installs the adapter and validates it.
2. **Master signed review receipt:** An independently held Ed25519 Master private key is injected through \`signMasterAck(payload)\` by the authorized real Master service, *never* stored in code or CI. The response must be signed by the **previously pinned** Master key, include the exact QL-495 request hash and custody data, and use only \`HOLD_FOR_INDEPENDENT_REVIEW\`. The already-shipped QL-495 client can validate this signed reply. No production ACK or customer effect is permitted.
3. **Private durable Master receiver ledger:** \`createQl496MasterReceiverLedger\` writes only safe metadata and hashes to an exclusive fsynced, hash-chained, 64-record append-only journal in a preexisting private directory. It rejects duplicate trial IDs, corrupt record digests, mismatched client pin and unsigned Master packets. Write/readback failure => HOLD, never a successful response.
4. **Independent original-device evidence review:** \`verifyQl496IndependentDeviceEvidence\` requires a previously pinned Master-signed one-use challenge (the caller is responsible for challenge issuance and anti-replay custody), an attestor-signed physical observation bound to the original enrolled device digest, two separately signed owner and independent-reviewer proofs, distinct Ed25519 identities, the same source receipt/trial/Master signed packet hashes, and short expiry windows. The result is **\`QL496_INDEPENDENT_SIGNED_DEVICE_EVIDENCE_REVIEW_HELD\`**, never \`physicallyCertified:true\`. The software cannot independently establish that a machine physically existed merely because signatures verify; true certification requires the separate human/provider audit of authorized original-device enrollment and original equipment. The module does not store or issue a physical certificate.
5. **Signed delivery reconciliation:** \`reconcileQl496SignedDelivery\` checks the signed Master ACK against QL-495 request hashes and the durable Master receiver journal. It reports \`QL496_SOURCE_MASTER_SIGNED_DELIVERY_RECONCILED_HELD\`, explicitly \`networkDeliveryToClientCertified:false\`, because a Master-side persisted response cannot prove the original Windows client actually received it. The QL-495 client maintains its own separate private verified receipt ledger; independent reconciliation of both custody ledgers must be performed outside this library.
6. **Original Windows inspection:** \`ql496-original-host-cli.mjs --status\` is safe and network-inert on any host. \`--evidence-summary\` is allowed only for original owner Windows candidate \`DESKTOP-AE894KC\` / user \`Ree\`, reads only private QL-495/496 journal counts and hashes, and does not authorize network transport or change files. The host name match is **not** trusted device attestation.

### Contract shape (for independently authorized Master integrators)

Existing QL-495 request is **POST** \`/internal/comms/master-delivery-trial\` with \`Content-Type: application/json\`, no query, metadata only:

- \`schema: rosevear.comms.ql495.master-delivery-trial.v1\`
- \`trialId, sourceId, receiptId, recordDigest, masterAuditDigest, masterJournalHead, provenanceDigest, sentAtMs\`
- \`requestedAction: ONE_SIGNED_PRIVATE_MASTER_TRIAL_REVIEW_ONLY\`
- \`customerDataIncluded: false, authorityTransfer: false\`

A separately hosted Master service must parse the request body with a small hard size limit (recommended maximum **4096 bytes**), validate exact source field types and recent timestamp, feed the actual authorized TLS socket through \`observeQl496ActualMutualTls\`, and call the pure handler using independent Master audit and source packet readers. It must respond with the handler's **original** \`signedResponsePacket\` as JSON only on a truly verified, fsynced success, or a generic non-sensitive HOLD/403/409 otherwise. The service must not accept a client supplied \`socket\`/TLS metadata JSON and must not set \`authorized:true\` from request headers. Our code does not provide a running service, default private endpoint hostname, certificate/key or automatic activation.

A signed successful trial response explicitly reads \`HOLD_FOR_INDEPENDENT_REVIEW\`, *not* production authorization or certificate of physical host identity.

### Original Windows: step-by-step after QL-496 code production promotion

Our last evidence showed the \`C:\rc470\` checkout is **clean**, on \`main\`, and its origin correctly points to \`https://github.com/RosevearCreations/rosevear-comms-hub.git\`. The local HEAD may still be at QL-494/495; use fast-forward only. On original Windows PC **DESKTOP-AE894KC**, log in as Ree and open PowerShell:

~~~powershell
Set-Location C:\rc470
git status -sb
git status --porcelain
git branch --show-current
git remote -v
~~~

If there are ANY local modifications/untracked items or the branch is not \`main\`, STOP. Do not clean, reset, force-pull, or delete local files.

For clean original \`main\`:

~~~powershell
git fetch origin main
git pull --ff-only origin main
git rev-parse HEAD
node --version
node .\runtimes\master-discovery\ql496-original-host-cli.mjs --status
~~~

Compare HEAD against the published **successful exact QL-496 main post-merge SHA**, not prior \`cb98516a86e3dae869c1865b7daa0a538a2d8ac0\`. The status must say \`QL496_MASTER_RECEIVER_OFF_BY_DEFAULT\`, \`masterEndpointListening:false\`, \`firstSourceFieldCertified:false\`, \`customerWrites:false\`.

If desired, to **inspect only** private evidence counts:

~~~powershell
$privateRoot = Join-Path $env:LOCALAPPDATA 'Rosevear\CommsHub\Private'
Test-Path -LiteralPath $privateRoot
Get-ChildItem -LiteralPath $privateRoot -Force -File |
    Select-Object Name,Length,LastWriteTime
node .\runtimes\master-discovery\ql496-original-host-cli.mjs --evidence-summary
~~~

If the folder is empty, expected genuine count is zero; the command may report HOLD if private enrollment is missing. Do not create test keys, signed packets, certificates, fake device challenges, or Master endpoints to make HOLD green. **Never paste raw PEM private keys, signed packet bodies or customer evidence into chat.**

### Required external field evidence before original-device certification is even eligible

- Independent source provider enrolls original first source with its real signed QL-494 packet, private mTLS endpoint, server certificate fingerprint, source revision and QL-486 separately approved issuer/owner/reviewer Ed25519 pins.
- Original Windows owner and separate reviewer revalidate the real source packet and QL-495 provenance while source and review signatures are fresh; private receipts remain outside GitHub.
- An authorized Master operator independently deploys the TLS server with actual approved Master signing key, legitimate original-client certificate pin, current QL-493 private audit, server-side trusted revalidation callbacks and durable Master receiver journal. The deployment and remote service health must be separately observed, not inferred from contract CI.
- Independent Master issues a short-lived signed physical-device challenge for a separately enrolled original device. Genuine externally authorized attestor, owner and reviewer sign their own evidence only after a real observation. Hardware enrollment and signature custody must be independently audited; merely using the known PC name is inadequate.
- Independent operator compares **actual** QL-495 client receipt ledger and QL-496 Master receiver ledger, hashes, first source receipt and independent hardware evidence. Any mismatch, missing device audit or missing real provider remains HOLD.

**At this release's initial state:** real source count 0, physical original-device certifications 0, no verified Master POST, no deployed private listener proven, and no customer writes. Tests do not alter this.

### CI and release gates

\`ql496-master-endpoint-contract.test.mjs\` tests no-listener baseline, actual socket-bound mTLS observation shape, refusal of proxy cert headers, stale/wrong source, changed Master audit, wrong signing key, durable replay/tamper, exact signed request/response matching, Master-signed physical challenge, distinct external witness roles, expired and fake packets, and non-authorizing reconciliation. These are **synthetic** fixtures only.

Scoped files must be introduced to \`dev\` and then onto \`main\` via a separate scoped transplant because repo histories diverged materially (as of QL-495: dev 612 commits ahead / main 556 behind). Before declaring code production GREEN: dev PR CI Linux/Windows SUCCESS, scoped main PR CI Linux/Windows SUCCESS, merged exact main SHA, post-merge Linux/Windows CI SUCCESS, and live public Worker static HTML/JS/CSS hash parity GREEN against exact same SHA. Any independent QL-333 source-manifest audit failure remains visible and unresolved.

**Next proposed: QL-497 — Independently Operated Master Endpoint Enrollment, Original-Windows Device Attestation Witness & Bidirectional Receipt Audit Closure.**
