# QL-493 — Verified Private Source Endpoint Readiness, Original-Host mTLS Enrollment Prerequisites & Independent Master Receipt Handoff

## Safety and what GREEN means

QL-493 is a **code release and manual private-readiness toolkit**, not proof that any source was enrolled, that an original Windows device was physically witnessed, or that the Master received a live packet. It provides:

1. A six-source **offline local mTLS preflight**. It invokes QL-488's exact six-source URL, distinct source identity, pinned server fingerprint, CA/client PEM and client key structure checks, then locally parses actual X.509 certificates and checks that each client's certificate public key matches its private key, and the local certificate validity window. It does **not** prove a remote endpoint exists, a certificate's chain is accepted remotely, or a server certificate fingerprint matches: only the explicit QL-488 real TLS probe can observe that.
2. An **optional, explicitly confirmed, original-Windows, single-source TLS 1.3 GET probe** to the independently pinned private source endpoint. The QL-488 HTTPS client checks hostname, certificate fingerprint, client mTLS, status, content type and source ID. Even a successful probe is only a transport observation: source-signature verification, original runtime provenance and production enrollment remain HOLD. The raw response is discarded without logging.
3. A **metadata-only, privately staged, two-signer source-to-Master audit handoff** bound to the exact independently rechecked QL-492 six-source audit digest and original QL-491/492 journal heads. A separately pinned independent Master public key may sign an offline ACK packet bound to the durable stage record digest. The ACK proves signature possession at intake, **not network delivery** or Master production acceptance. No automatic calls, email, SMS, customer writes, source writes, authority transfer, or receiver startup occur.
4. A private hash-chained single-writer, fsynced, restart-checked handoff/ACK journal. It rejects duplicates, stale approvals, role/key reuse, modified audit evidence, cross-stage ACKs and tampered files.

**Production GREEN** = GitHub dev/main merges, Linux and Windows tests and exact-main Cloudflare public static JS/CSS parity success. **Six real sources live GREEN** = separately unverified, still **HOLD** until real endpoint, credential, signer and independent field evidence exist.

## What the owner has already confirmed

Original Windows host candidate: DESKTOP-AE894KC in Ree user profile. Previous PowerShell output confirmed C:\rc470 at QL-492 main 25ceda00b0cbb18a076c81741092f78733151df9, Node v22.22.3 and QL-492 status QL492_NO_SEND_OFF_BY_DEFAULT. The original owner-private directory was created with SYSTEM, Administrators and Ree FullControl. The directory was empty and a search under LOCALAPPDATA/PROGRAMDATA Rosevear did not find QL-483 through QL-491 enrollment files.

**For this GitHub-only QL-493 release, the owner need do NOTHING on Windows.** In particular, do not create fake endpoint JSON, PEM certificates or signer ACKs to make the preflight appear GREEN.

## Optional owner-PC code update — when, where, how

When we want QL-493's new commands locally (not required for production code promotion):

1. On original DESKTOP-AE894KC, sign into Windows as Ree, open normal PowerShell, and inspect C:\rc470:

~~~powershell
Set-Location C:\rc470
git status -sb
git status --porcelain
git branch --show-current
git remote -v
~~~

If changes/untracked files appear or the branch is not main, STOP. Preserve files; don't reset, clean, stash indiscriminately, or pull over work. Only on a **clean main** do:

~~~powershell
git fetch origin main
git pull --ff-only origin main
git rev-parse HEAD
~~~

Verify the full hash matches the **QL-493 post-merge verified main SHA** recorded in GitHub release acceptance, not the earlier QL-492 hash. GitHub code deployment does not update C:\rc470 automatically.

2. Check Node 22+ and the new command's inert status:

~~~powershell
node --version
node .\runtimes\master-discovery\ql493-original-host-cli.mjs --status
~~~

Expected state QL493_PRIVATE_ENROLLMENT_OFF_BY_DEFAULT; originalHostCandidate:true, verifiedLiveSources:0, masterNetworkDelivery:false, automaticProbe:false. This is a local guard, not a cryptographic host identity certificate.

3. To inspect existing private filenames **without printing their contents**:

~~~powershell
$privateRoot = Join-Path $env:LOCALAPPDATA 'Rosevear\CommsHub\Private'
Test-Path -LiteralPath $privateRoot
Get-ChildItem -LiteralPath $privateRoot -File | Select-Object Name,Length,LastWriteTime
~~~

An empty directory means STOP before any real --preflight, --probe, --audit, --stage or --ack operation. Genuine prerequisite onboarding must occur in the actual source apps and their independently operated trust custody before continuing.

## Genuine private six-source mTLS readiness — only once credentials exist

QL-493 reuses QL-488's existing restricted private file:
%LOCALAPPDATA%\Rosevear\CommsHub\Private\ql488-endpoints.json

The JSON top-level shape is exactly an object with the single key endpoints. That object must contain exactly six source IDs: yw, icamp, rosiedazzlers, devilndove, ai-data-platform, rosevear-ai-hub.

Each value has precisely sourceId, url, serverCertificateSha256, caPem, clientCertificatePem, clientKeyPem. Each URL must be the source's **real separately verified HTTPS private DNS** route /internal/comms/source-release on 443 or 8443, and its SHA-256 server certificate fingerprint must already have been independently pinned. CA/client PEM certificates and the matching client private key must originate from authorized source owners; one app's keys cannot be reused for another.

The QL-493 preflight checks actual local PEM parsing, certificate/key public identity match and certificate validity, but it does not attempt a TLS handshake. The prior QL-488 transport policy also checks distinct hostnames/server pins and refuses unsafe URLs.

Once the above real configuration exists, run:

~~~powershell
$endpointsFile = Join-Path $privateRoot 'ql488-endpoints.json'
Test-Path -LiteralPath $endpointsFile
node .\runtimes\master-discovery\ql493-original-host-cli.mjs --preflight "$endpointsFile"
~~~

If missing or malformed, HOLD. A full local preflight can return SIX_SOURCE_MTLS_LOCAL_PREREQUISITES_VALIDATED_NOT_CONNECTED, explicitly still **NOT CONNECTED**. Don't paste the endpoint config, PEM, key, certificate or raw JSON in chat.

When actual original source endpoint implementation and authorized live credentials are independently verified, the owner may perform **one explicit network GET** for a single source:

~~~powershell
node .\runtimes\master-discovery\ql493-original-host-cli.mjs --probe "$endpointsFile" yw
~~~

The tool prompts for exact phrase PROBE ONE REAL PINNED SOURCE. This is not a safe command to run on guessed endpoints or while the private folder is empty. The result QL493_REAL_MTLS_TRANSPORT_OBSERVED_SOURCE_UNVERIFIED indicates the current HTTPS handshake and expected source ID were observed, **not** original source runtime signature certification. Genuine signing and live acceptance require the separate QL-485/486/487/489 ceremonies with independently approved original source evidence.

## Independent offline source-to-Master receipt handoff — only once real prior custody exists

The original QL-489 trust JSON must be a genuine existing private file under the same owner private root, with exactly registryDirectory, evidenceDirectory, endpoints, pins, ownerPins, reviewerPins, windowsHostPublicKeyPem and exceptionPins.

It must refer to a real existing private evidenceDirectory beneath the owner private root. The QL-491 and QL-492 journal records must independently verify using the installed modules; a blank config does not create them.

A **second owner-private file containing PUBLIC keys only** is required for QL-493. It has exactly ownerPublicKeyPem, reviewerPublicKeyPem, masterPublicKeyPem, bound to three separate independently approved Ed25519 signing identities. The Master key must be independently enrolled out of band, **not copied from an owner or reviewer**. Do not create placeholder IDs, private keys or signatures.

After genuine owner-approved files exist, set $trustConfig to its verified actual filename and $masterPinsFile to its actual file path under the private root:

~~~powershell
$trustConfig = Join-Path $privateRoot 'ACTUAL_EXISTING_QL489_TRUST_CONFIG.json'
$masterPinsFile = Join-Path $privateRoot 'ACTUAL_INDEPENDENT_MASTER_PUBLIC_PINS.json'
Test-Path -LiteralPath $trustConfig
Test-Path -LiteralPath $masterPinsFile
node .\runtimes\master-discovery\ql493-original-host-cli.mjs --audit "$trustConfig" "$masterPinsFile"
~~~

Replace names with **real known files**; do not run with literal ACTUAL_ placeholders. QL493_PRIVATE_ENDPOINT_PREREQUISITES_AND_MASTER_AUDIT_HELD means the QL-492 source-to-Master audit digest and handoff journal are readable. It does **not** imply live Master delivery.

### Optional, separately signed one-time offline Master handoff stage

A private JSON file under the owner root has exactly ownerPacket, reviewerPacket; each packet is exactly payload plus Ed25519 base64url signature of the exact canonical JSON payload. These must be signed by **two different authorized independently pinned** operator/reviewer private keys, never by inventing a second actor. The two payloads must share these exact fields:

~~~text
schema: "rosevear.comms.ql493.signed-offline-master-handoff.v1"
handoffId: unique 8-96 character ID
auditDigest: exact current QL-492 auditEvidenceDigest
ql491JournalHead: exact current QL-492 priorJournalHead, or null
ql492JournalHead: exact current QL-492 ql492JournalHead, or null
sourceCount: 6
recipient: "rosevear-master"
requestedAction: "OFFLINE_AUDIT_HANDOFF_FOR_INDEPENDENT_REVIEW"
role: "owner" or "independent-reviewer" respectively
actorId: distinct approved identities, each 8-96 characters
issuedAtMs: current Unix milliseconds, within the previous 120 seconds
expiresAtMs: future Unix milliseconds, at most 300 seconds after issue
customerDataIncluded: false
authorityTransfer: false
~~~

Only when genuine separately signed packets are present:

~~~powershell
$handoffFile = Join-Path $privateRoot 'ACTUAL_TWO_SIGNED_QL493_HANDOFF.json'
Test-Path -LiteralPath $handoffFile
node .\runtimes\master-discovery\ql493-original-host-cli.mjs --stage "$trustConfig" "$masterPinsFile" "$handoffFile"
~~~

The original owner must type exactly STAGE ONE SIGNED OFFLINE MASTER HANDOFF. Success reports TWO_PARTY_OFFLINE_MASTER_HANDOFF_STAGED_HELD. This is only an owner-private receipt, not network delivery to the Master.

### Optional independent Master-signed ACK packet

Only the already separately pinned Master key may sign the ACK. A private JSON file must contain exactly masterPacket with signed payload fields:

~~~text
schema: "rosevear.comms.ql493.independent-master-ack-packet.v1"
ackId: unique 8-96 character ID
handoffId: exact staged handoffId
stageRecordDigest: exact QL-493 durable stage recordDigest
auditDigest: exact still-current QL-492 auditEvidenceDigest
acknowledgedAction: "ACKNOWLEDGE_OFFLINE_AUDIT_PACKET_ONLY"
role: "independent-master-auditor"
actorId: authorized 8-96 character Master identity
issuedAtMs: fresh Unix milliseconds within previous 120 seconds
expiresAtMs: future Unix milliseconds, no later than 300 seconds after issue
deliveryObserved: false
customerDataIncluded: false
authorityTransfer: false
~~~

Only with an authentic separately signed packet:

~~~powershell
$ackFile = Join-Path $privateRoot 'ACTUAL_MASTER_SIGNED_ACK.json'
Test-Path -LiteralPath $ackFile
node .\runtimes\master-discovery\ql493-original-host-cli.mjs --ack "$trustConfig" "$masterPinsFile" "$ackFile"
~~~

At the prompt type exactly RECORD ONE SIGNED MASTER ACK PACKET. A success state INDEPENDENT_SIGNED_MASTER_ACK_PACKET_RECORDED_HELD proves only that a packet verified against the pinned independent Master key **at local intake**, not actual network delivery, current Master application acceptance or any six-source field certification.

## CI/Production acceptance

- Linux and Windows reject absent real certificates, fake PEM material, unsafe/duplicate source endpoints, signer role misuse, altered QL-492 audit digest, reused signing identities, duplicate handoff/ACK, false delivery claims and private journal tampering.
- QL-493's default CI status must stay offline, with zero network sends/customer effects.
- Only QL-493 implementation, tests, runbook and CI workflow are transplanted to main. Dev/main histories are intentionally divergent; no wholesale dev merge is authorized.
- All scoped candidate CI must pass; dev then main PR merged; exact-main post-merge Linux/Windows release gates and public Worker HTML/JS/CSS parity GREEN.
- Public static Worker parity cannot certify original Windows identity, source mTLS reachability, source-signing enrollment, independently witnessed device access, live Master inbox delivery or real source health.

**Next proposed:** QL-494 — Original Private mTLS Source Adapter Readiness, Independent First-Source Receiver Receipt & Master Reconciliation Review.
