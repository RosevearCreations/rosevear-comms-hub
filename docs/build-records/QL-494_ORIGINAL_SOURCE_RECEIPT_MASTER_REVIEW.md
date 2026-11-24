# QL-494 — Original Private mTLS Source Adapter Readiness, Independent First-Source Receiver Receipt & Master Reconciliation Review

## Exact status and security boundary

QL-494 adds original Windows-owner guarded first-source **metadata-only receipt intake** that is permitted only after a *real*, explicitly supervised QL-488 TLS 1.3 GET to the existing independently pinned private endpoint. Its transport client checks normal TLS CA + hostname validation, an independently pinned server certificate fingerprint, configured client mTLS, HTTP status, JSON content type, bounded response size and matching sourceId. The returned source bundle must include a separately **source-signed QL-494 adapter receipt**. Its Ed25519 key and revision must match the existing **independently approved QL-486 registry pin**, not merely a newly supplied public key file. Two distinct independently pinned QL-486 owner and reviewer signers must also approve the exact same source receipt digest, QL-493 private Master audit digest and QL-493 journal head.

QL-494 commits only source IDs, revisions, timestamp, approved endpoint fingerprint, immutable SHA-256 proof digests, signer packet hashes and independent Master custody digests into an exclusive single-writer fsynced hash-chained **owner-private** receipt ledger. Replay, tamper, forged source or reviewer signatures, changed QL-493 audit, cross-source key reuse and mismatched pins return HOLD. Independent readback reports per-source received claim counts; it never claims Master network delivery or an accepted production physical witness.

**Production GREEN means the feature code, security tests, branch promotions and public Worker JS/CSS parity are verified.** Even a genuine mTLS transport observation and signed packet cannot by themselves demonstrate original physical hardware provenance, prove a third-party service's live operational health or certify a source. This build does NOT create source services, private DNS, certificates or user accounts, send to an external Master, operate a background receiver, start an automatic poll, write tenant/customer data, or grant source authority.

## Current original owner Windows facts

In the previous terminal outputs, the original owner candidate was DESKTOP-AE894KC, Windows username ree. C:\rc470 contained QL-493 main code after a fast-forward, Node v22.22.3; QL-492 status QL492_NO_SEND_OFF_BY_DEFAULT and QL-493 status remain safe/zero source connections. The private root \`$env:LOCALAPPDATA\Rosevear\CommsHub\Private\` had been created with SYSTEM, Administrators and Ree owner FullControl but contained no existing QL-483 through QL-491 credentials. We have **no evidence it gained authentic files afterward**. This release does not assert otherwise.

**No Windows owner action is needed to merge or production-verify QL-494.** The optional steps are for later supervised original source enrollment, after actual independently issued private trust exists. Never create simulated certificates, fabricated Ed25519 evidence or placeholder source services just to satisfy the tests.

## Step by step: safely update original Windows checkout

Where: On DESKTOP-AE894KC, signed into Windows as Ree, open **PowerShell** and use the established Rosevear Comms Hub \`C:\rc470\` folder. When: after verified QL-494 main release.

**1. Inspect files and branch before touching the checkout:**

~~~powershell
Set-Location C:\rc470
git status -sb
git status --porcelain
git remote -v
git branch --show-current
~~~

Stop if any untracked/modified files exist, if branch is not \`main\`, or if origin isn't \`https://github.com/RosevearCreations/rosevear-comms-hub.git\`. Do not reset, clean, force-update or discard other application work. Only for a clean \`main\`:

~~~powershell
git fetch origin main
git pull --ff-only origin main
git rev-parse HEAD
~~~

Compare full SHA to the **QL-494 main merge commit** recorded in the GitHub CI run (not previous QL-493 SHA). GitHub promotion alone does not update Windows.

**2. Confirm Node 22+ and the safe no-send command:**

~~~powershell
node --version
node .\runtimes\master-discovery\ql494-original-host-cli.mjs --status
~~~

Expected \`QL494_FIRST_SOURCE_RECEIVER_OFF_BY_DEFAULT\`, originalHostCandidate true, verifiedLiveSources=0, networkListener=false, unattendedTransport=false, masterDelivery=false, customerWrites=false. A hostname/user match only identifies an original **candidate**, not physical host certification.

**3. Inspect private filenames only, not their contents:**

~~~powershell
$privateRoot = Join-Path $env:LOCALAPPDATA 'Rosevear\CommsHub\Private'
Test-Path -LiteralPath $privateRoot
Get-ChildItem -LiteralPath $privateRoot -File | Select-Object Name,Length,LastWriteTime
~~~

If empty or missing signed actual provider configurations, **STOP**. Do not run the commands below yet.

## Genuine six-source private prerequisites

QL-494 expects *three separately owner-controlled configurations* in the real private root:

- \`ql488-endpoints.json\` — existing QL-488 canonical six-source \`{"endpoints":{...}}\` file. Exactly six independently approved sources: \`yw\`, \`icamp\`, \`rosiedazzlers\`, \`devilndove\`, \`ai-data-platform\`, \`rosevear-ai-hub\`. Each has sourceId, distinct real https://private-DNS/internal/comms/source-release URL on 443/8443, independently verified serverCertificateSha256 and authorized CA PEM/client certificate PEM/client key PEM. Never share these credentials in chat or GitHub. Source endpoint must **actually implement** the private read-only signed adapter contract.
- \`ql494-source-pins.json\` — **public pins only**, exact top-level key \`sourcePins\` with exactly those six source IDs. Each source object must contain exactly \`sourceId\`, \`sourcePublicKeyPem\` (real Ed25519 public signing key), \`sourceRevision\` (genuine lowercase 40-hex source commit). The source signer and revision must match the *independently approved* QL-486 \`trust.pins[id]\`. These pins are **not** a way to self-enroll a new source or approve new revisions.
- The existing owner-private genuine QL-489 \`trust\` configuration file, exact keys \`registryDirectory\`, \`evidenceDirectory\`, \`endpoints\`, \`pins\`, \`ownerPins\`, \`reviewerPins\`, \`windowsHostPublicKeyPem\`, \`exceptionPins\`; and the existing QL-493 **independent Master PUBLIC keys** config, exact keys \`ownerPublicKeyPem\`, \`reviewerPublicKeyPem\`, \`masterPublicKeyPem\`. Its keys must be independently enrolled, distinct, owner-controlled. These are required to independently rehash the actual QL-491/492/493 private journals.

**4. Only after actual trusted files exist, inspect locally without a network connection:**

~~~powershell
$endpointsFile = Join-Path $privateRoot 'ql488-endpoints.json'
$sourcePinsFile = Join-Path $privateRoot 'ql494-source-pins.json'
Test-Path -LiteralPath $endpointsFile
Test-Path -LiteralPath $sourcePinsFile
node .\runtimes\master-discovery\ql494-original-host-cli.mjs --preflight "$endpointsFile" "$sourcePinsFile"
~~~

This combines QL-488 exact six-source structure, distinct pinned source Ed25519 key format and QL-493 certificate/CA/client-key local-validity checks. A successful \`QL494_LOCAL_ADAPTER_AND_MTLS_PREREQUISITES_READY_NOT_CONNECTED\` is *explicitly NOT proof of any real network connection*.

**5. Only after a real source-signed adapter and independent review ceremony exists, supply actual signed envelopes.** A real authenticated source must return JSON with exact \`sourceId\` and \`adapterPacket\`. \`adapterPacket\` is an Ed25519 \`{payload,signature}\` envelope (signature is base64url over \`canonicalize(payload)\`) with exact fields:

~~~text
schema: "rosevear.comms.ql494.private-source-adapter-receipt.v1"
receiptId: unique 8–96-character alphanumeric/-/_ identifier
sourceId: canonical source ID
sourceRevision: exact independently approved 40-lowercase-hex SHA
endpointFingerprint: actual pre-pinned 64-lowercase-hex server cert fingerprint
capturedAtMs: UTC epoch milliseconds within previous 120 seconds
expiresAtMs: UTC epoch milliseconds in future, <=300 seconds after capture
payloadDigest: 64-lowercase-hex source observation SHA-256 digest, no customer content
requestedAction: "PRIVATE_RECEIVER_RECEIPT_REVIEW_ONLY"
customerDataIncluded: false
authorityTransfer: false
~~~

The separate, independently signed operator/reviewer JSON file contains exactly \`{"ownerPacket":{...},"reviewerPacket":{...}}\`, where each envelope has \`payload\` and \`signature\`. Each payload requires exactly:

~~~text
schema: "rosevear.comms.ql494.independent-first-source-review.v1"
reviewId: identical unique 8–96-character ID
receiptId: identical to the real source-signed adapter receipt
sourceId: identical real source ID
sourcePacketDigest: SHA-256 canonical digest of the exact real signed adapterPacket
masterAuditDigest: current independent QL-493 sixSourceAuditDigest
masterJournalHead: current QL-493 ql493Head or null
requestedAction: "REVIEW_ONE_FIRST_SOURCE_RECEIPT_NO_SEND"
role: "owner" or "independent-reviewer", respectively
actorId: two different independently approved real identities
issuedAtMs: UTC epoch milliseconds no more than 120 seconds old
expiresAtMs: UTC epoch milliseconds in future <=300 seconds after issue
customerDataIncluded: false
authorityTransfer: false
~~~

Do not generate dummy source signatures, fake Master heads, reused reviewer keys or synthetic observation digests. The review approval must be issued while the source packet is fresh. A source-signed packet obtained in a real owner-approved transport ceremony cannot be recreated by tests; operator authorization must be independent.

**6. Optional one-time supervised genuine first source (example Yard Workers):**

After independent source custody is genuinely prepared and the actual private filenames are confirmed, set paths below using real files. The placeholder names below are NOT intended for execution:

~~~powershell
$trustConfig = Join-Path $privateRoot 'ACTUAL_EXISTING_QL489_TRUST.json'
$masterPins = Join-Path $privateRoot 'ACTUAL_INDEPENDENT_MASTER_PINS.json'
$reviewFile = Join-Path $privateRoot 'ACTUAL_TWO_SIGNED_QL494_REVIEW.json'
Test-Path -LiteralPath $trustConfig
Test-Path -LiteralPath $masterPins
Test-Path -LiteralPath $reviewFile
~~~

If any is False, STOP. With real independently reviewed and freshly signed packet evidence, use **one explicit interactive network action**:

~~~powershell
node .\runtimes\master-discovery\ql494-original-host-cli.mjs --witness "$endpointsFile" "$sourcePinsFile" "$trustConfig" "$masterPins" "$reviewFile" yw
~~~

At the prompt, type exactly: \`WITNESS ONE FIRST PRIVATE SOURCE RECEIPT NO SEND\`.

The CLI makes one bounded owner-authorized pinned TLS GET, verifies the source's signed receipt and two separate independent review signatures against the current independently rehashed QL-493 Master projection, then fsyncs one private immutable metadata record. Success state \`SIGNED_FIRST_SOURCE_RECEIVER_RECEIPT_REVIEW_HELD\` means exactly that: **a signed first-source claim was recorded for independent review**. It does not grant production source authority, certify the original physical device, enable future automatic connections or deliver to the Master. Failure returns HOLD; do not bypass or re-sign expired evidence.

**7. Optional no-network six-source metadata reconciliation:**

Only after the same real private files exist:

~~~powershell
node .\runtimes\master-discovery\ql494-original-host-cli.mjs --reconcile "$endpointsFile" "$sourcePinsFile" "$trustConfig" "$masterPins"
~~~

Expected \`QL494_INDEPENDENT_FIRST_SOURCE_MASTER_RECONCILIATION_HELD\` with recorded per-source claim counts and exact QL-493/494 hash-chain heads. Original runtime source acceptance, external Master delivery and independent real-device field certification remain false.

## Acceptance gates and truth limits

- Linux and Windows CI run QL-494 tests alongside unchanged QL-336A and QL-485–493 fail-closed gates. Test packets and fixture "transport observations" are **synthetic**, useful only for cryptographic and logic regression, not actual source enrollment evidence.
- Only the QL-494 5 scoped files merge through dev and main; unrelated dev commits remain isolated given the current diverged branch histories.
- Exact main SHA, post-merge Linux and Windows CI, and live public Worker JS/CSS SHA-256 parity are required before declaring **production code GREEN**.
- The separate scheduled QL-333 public manifest audit and actual original Windows source/receiver certifications remain visible HOLDs until genuine original service acceptance.

**Next proposed: QL-495 — Original First-Source Signed Receipt Provenance, Independent Master Delivery Trial & Source-Attestation Drift Enforcement.**
