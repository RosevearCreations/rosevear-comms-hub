# QL-495 — Original First-Source Signed Receipt Provenance, Independent Master Delivery Trial & Source-Attestation Drift Enforcement

## Scope and truth boundary

QL-495 implements three independently gated features:

1. **Independent QL-494 provenance readback.** The owner-private QL-494 append-only journal is re-read and hash/sequence/replay-checked independently. The original real source-signed QL-494 adapter packet and both **separately signed** owner/reviewer review packets are needed again; QL-494 stores their SHA-256 hashes, **not the original signed packet contents**. QL-495 validates the real original packets, record timestamp, source identity, server certificate pin, 40-character approved source revision, QL-486 independently approved source signing key and independent owner/reviewer Ed25519 keys against the original QL-494 record and current QL-493 Master audit hash/journal head. Historic valid signatures may be revalidated after expiry, but are **never treated as fresh authority for a new trial**.
2. **Attestation drift enforcement.** Current six-source QL-488 mTLS endpoints, six QL-494 source public keys/revisions and independently approved QL-486 source/owner/reviewer pins are checked. The source journal is correlated against the current QL-493 Master audit digest and journal head. Mismatched signer identity, revision, endpoint TLS fingerprint, journal hash, Master audit hash, missing configuration, or altered source evidence => HOLD. Passing a local pin check is **not** remote certificate validation or a live source connection.
3. **An optional ONE-TIME OWNER-APPROVED actual private Master delivery trial.** After a fresh legitimate source receipt is revalidated, one HTTPS TLS 1.3 **POST** may send only a restricted metadata-only trial envelope to a *separately enrolled and pinned private Master endpoint* at \`/internal/comms/master-delivery-trial\`. Client mTLS, CA verification, remote hostname and pre-pinned server certificate SHA-256 are required. A genuine signed Master response is accepted only if its independently pre-enrolled Ed25519 signature, trial ID, original source receipt, audit head/digest, exact request digest, timestamps, fixed non-authorizing disposition and privacy controls match. The resulting receipt hash is stored in a new fsynced private append-only anti-replay journal. A TLS 200 without valid signature is HOLD. An independently signed Master trial acknowledgment is not production acceptance, a customer reply, or physical-device certification.

There is **NO automatic POST, background receiver, polling, default send, production Master ACK, customer write, source write, trust-on-first-use, endpoint creation, private key generation, or physical field certification**.

**Production code GREEN** means QL-495 scoped files merged to dev/main, Linux/Windows tests passed, and the exact main SHA matched public Worker HTML/JS/CSS static asset parity. **Operational original six-source enrollment and Master integration** remain separate **HOLD** until a genuine first source and pinned Master endpoint/receipt are actually observed. Do not treat CI fixtures as operational evidence.

## Already observed owner Windows facts

On actual DESKTOP-AE894KC, Windows user Ree, the user showed \`C:\rc470\` at QL-494 production commit \`9f139493aa422da197666cfde5cd792a720c339f\` and:

\`{"state":"QL494_FIRST_SOURCE_RECEIVER_OFF_BY_DEFAULT","originalHostCandidate":true,"verifiedLiveSources":0,"originalPhysicalWitnessesCertified":0,"networkListener":false,"unattendedTransport":false,"masterDelivery":false,"customerWrites":false}\`

Previous checks found the owner-private root directory empty and zero existing enrollment files in standard Rosevear AppData locations. These observations do not prove that no other backup exists. QL-495 does not create any trust/certificate/physical proof. **The owner need do NOTHING to promote QL-495's GitHub code.**

## Step by step: safe Windows source update after verified main promotion

Where: original Windows computer DESKTOP-AE894KC, sign in as Ree, start ordinary PowerShell; do not use Administrator unless already needed for other work.

1. Inspect checkout and files first:

~~~powershell
Set-Location C:\rc470
git status -sb
git status --porcelain
git branch --show-current
git remote -v
~~~

STOP if files are modified/untracked, if branch is not \`main\`, or if origin isn't \`https://github.com/RosevearCreations/rosevear-comms-hub.git\`. Do NOT reset, clean, force or overwrite local work.

2. Only when the repository is clean and on \`main\`:

~~~powershell
git fetch origin main
git pull --ff-only origin main
git rev-parse HEAD
node --version
node .\runtimes\master-discovery\ql495-original-host-cli.mjs --status
~~~

The SHA must match the **exact QL-495 successful post-merge main SHA**, not the prior QL-494 hash. The status will say \`QL495_FIRST_SOURCE_PROVENANCE_TRIAL_OFF_BY_DEFAULT\` with zero live first sources, zero verified trial receipts, no automatic network send, and no customer writes. The hostname/username match is a candidate-only indicator; it is not cryptographic proof of original physical host.

3. Check private filenames (never paste PEM, private keys, raw trust files, signed packets or customer data):

~~~powershell
$privateRoot = Join-Path $env:LOCALAPPDATA 'Rosevear\CommsHub\Private'
Test-Path -LiteralPath $privateRoot
Get-ChildItem -LiteralPath $privateRoot -File |
    Select-Object Name,Length,LastWriteTime
~~~

If the folder is empty, **STOP**. We still need authentic source endpoint(s), QL-486 approved identity/revision custody, private mTLS materials and independently issued real Master endpoint/public signer. No placeholder files or self-signed replacement certificates may be used to claim GREEN.

## Genuine prerequisites, if and only if independently provisioned

All input files must be under the above owner-private root. Only owner-authorized real issuance may create these:

- \`ql488-endpoints.json\` exact top-level \`endpoints\`; six QL-488 source-specific real private DNS https URLs, separately pre-pinned remote server cert fingerprints, real authorized client mTLS cert/key/CA material.
- \`ql494-source-pins.json\` exact top-level \`sourcePins\`; six real distinct approved Ed25519 source key PEMs plus real 40-lowercase-hex source revisions.
- An **existing genuine QL-489 trust file** with exactly \`registryDirectory\`, \`evidenceDirectory\`, \`endpoints\`, \`pins\`, \`ownerPins\`, \`reviewerPins\`, \`windowsHostPublicKeyPem\`, \`exceptionPins\`. The \`pins\` must carry the independently approved QL-486 source key and \`approvedRevision\` used by the QL-494 receipt validation. Never self-add that approval. The referenced evidenceDirectory must already be a true private folder beneath the owner root. Authentic QL-491/492/493 private custody is needed to reconstruct the current Master audit.
- An **existing genuine QL-493 Master public pin file** with exactly \`ownerPublicKeyPem\`, \`reviewerPublicKeyPem\`, \`masterPublicKeyPem\`. The last key belongs to the separately approved real Master signing identity; do not invent a Master actor/key.
- The **original genuine QL-494 source-signed \`sourcePacket\`** and **two separate genuine authorized \`ownerPacket\` and \`reviewerPacket\`**. A private file must contain exactly these three names with their original entire \`{payload,signature}\` envelopes. The QL-494 historical private hash ledger does not contain their full signatures. Do not fabricate/re-sign old packets to hide loss of evidence.
- For the optional **real network trial only**, a separately provisioned and pinned \`ql495-master-endpoint.json\` with EXACTLY five fields: \`url\`, \`serverCertificateSha256\`, \`caPem\`, \`clientCertificatePem\`, \`clientKeyPem\`. The real Master service must implement **POST** \`/internal/comms/master-delivery-trial\` at a unique approved private HTTPS DNS on port 443/8443 and return a valid independently Master-signed QL-495 ACK. This endpoint is **not provided or activated automatically** by Comms Hub. If not already implemented, stay HOLD; no invented external URL or test server.

## Read-only drift audit — ONLY after real private files exist

Set the source filenames to their true verified existing files. The placeholder names below are not executable instructions until replaced with real approved files:

~~~powershell
$endpointsFile = Join-Path $privateRoot 'ql488-endpoints.json'
$sourcePinsFile = Join-Path $privateRoot 'ql494-source-pins.json'
$trustFile = Join-Path $privateRoot 'ACTUAL_EXISTING_QL489_TRUST.json'
$masterPinsFile = Join-Path $privateRoot 'ACTUAL_EXISTING_QL493_MASTER_PUBLIC_PINS.json'
Test-Path -LiteralPath $endpointsFile
Test-Path -LiteralPath $sourcePinsFile
Test-Path -LiteralPath $trustFile
Test-Path -LiteralPath $masterPinsFile
~~~

Only if every result is True and these are genuinely independently enrolled:

~~~powershell
node .\runtimes\master-discovery\ql495-original-host-cli.mjs --drift "$endpointsFile" "$sourcePinsFile" "$trustFile" "$masterPinsFile"
~~~

Expected only with authentic intact prior journals and pins: \`QL495_INDEPENDENT_SOURCE_PROVENANCE_DRIFT_READBACK_HELD\`. It reports **zero** operationally verified source certifications and no Master delivery. It is not a connection probe.

## Verify ONE historical receipt — no network

The full historical source/reviewer packets file must contain exactly \`sourcePacket\`, \`ownerPacket\`, \`reviewerPacket\`, preserving their true QL-494 signatures and fields. Replace the path and IDs with actual previously logged values:

~~~powershell
$packetFile = Join-Path $privateRoot 'ACTUAL_ORIGINAL_QL494_SIGNED_PACKETS.json'
$sourceId = 'yw'
$receiptId = 'ACTUAL_PRIOR_SIGNED_RECEIPT_ID'
Test-Path -LiteralPath $packetFile
node .\runtimes\master-discovery\ql495-original-host-cli.mjs --provenance "$endpointsFile" "$sourcePinsFile" "$trustFile" "$masterPinsFile" "$packetFile" $sourceId $receiptId
~~~

Expected after authentic verification: \`QL495_HISTORICAL_SOURCE_RECEIPT_PROVENANCE_RECHECKED_HELD\`; explicitly \`originalHardwareProvenanceVerified:false\` and \`masterNetworkDeliveryVerified:false\`. An expired historical receipt may still be proven as historic, but \`trialEligibleWhileSourcePacketFresh:false\` blocks a new trial.

## Optional real private Master delivery trial — NOT currently enabled

Only if all prior steps are valid, the original source receipt is **still fresh**, the independently approved Master endpoint actually exists and returns a real signed response, and the owner deliberately authorizes one private network POST:

~~~powershell
$masterEndpointFile = Join-Path $privateRoot 'ql495-master-endpoint.json'
Test-Path -LiteralPath $masterEndpointFile
~~~

If False or the Master service does not implement the documented endpoint, STOP. Do not run a mock endpoint as live production evidence.

One unique, genuine trial ID per attempt is required:

~~~powershell
$trialId = 'owner_approved_unique_ql495_0001'
node .\runtimes\master-discovery\ql495-original-host-cli.mjs --trial "$endpointsFile" "$sourcePinsFile" "$trustFile" "$masterPinsFile" "$packetFile" $sourceId $receiptId "$masterEndpointFile" $trialId
~~~

It prompts exactly \`SEND ONE PINNED PRIVATE MASTER TRIAL NO PRODUCTION ACCEPTANCE\`. The owner must type the full phrase intentionally. The command sends ONLY metadata: trialId, sourceId, receiptId, immutable prior QL-494 receipt digest, QL-493 Master audit hash and journal head, provenance digest, UTC timestamp and explicit \`customerDataIncluded:false\`, \`authorityTransfer:false\`. No private signed source packets, customer data or credentials are POSTed. The HTTPS connection is TLS 1.3 with mTLS, CA/hostname checks and preapproved remote certificate fingerprint. Invalid/unsigned/expired/mismatched Master response => HOLD.

The expected genuinely successful state, after verified live signed Master response and fsynced private journal readback, is \`QL495_DURABLE_PINNED_MASTER_TRIAL_RECEIPT_FOR_REVIEW_HELD\`. It confirms a single signed trial response reached the owner client, **not** independent physical original-host certification, source operational acceptance, or full production Master ACK activation. Without genuine credentials and Master endpoint, a successful live trial cannot be reported.

## CI/verification

QL-495 regression tests use test-only synthetic signatures and local journals. They cover historical signed source/reviewer packet digests, source and TLS pin drift, Master audit change, expiry, fabricated Master ACK, wrong trial/source/request hash, replay, private log tampering, disabled CLI, and malformed endpoint certificates. These tests do not initiate a real private POST.

The production release must merge dev first, then only five QL-495-specific files into main because dev/main ancestry remains substantially divergent. Exact main post-merge Linux/Windows CI and public Worker JS/CSS SHA256 parity on the same commit are required for production **code** GREEN. The separate scheduled QL-333 public manifest audit and actual physical first-source field acceptance remain independently tracked HOLD.

**Next proposed:** QL-496 — Genuine First-Source Master Trial Endpoint Contract, Independent Original-Device Evidence Closure & Signed Delivery Reconciliation.
