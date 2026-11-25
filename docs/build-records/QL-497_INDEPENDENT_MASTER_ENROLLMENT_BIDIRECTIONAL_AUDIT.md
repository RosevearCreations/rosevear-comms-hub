# QL-497 — Independently Operated Master Endpoint Enrollment, Original-Windows Device Attestation Witness & Bidirectional Receipt Audit Closure

## What this release does — and does not do

QL-497 is a **non-networking enrollment and cryptographic evidence review layer** over QL-495/496. It does not start the separately operated Master TLS server, create a provider endpoint, issue credentials, enroll original hardware, establish a customer connection, certify a physical device, or activate Master production delivery.

The code artifacts are:

- \`runtimes/master-discovery/ql497-independent-master-enrollment.mjs\` — independently signed three-party **Master endpoint enrollment review**, externally signed hardware observation review and separately signed two-sided QL-495 client and QL-496 Master receipt reconciliation.
- \`runtimes/master-discovery/ql497-independent-master-enrollment.test.mjs\` — synthetic success (review HOLD only), malformed/forged/stale/replayed/cross-source denial tests and tampered ledger fixtures.
- \`runtimes/master-discovery/ql497-original-host-cli.mjs\` — original Windows owner \`--status\` and optional **read-only** \`--local-receipt\`. No private network, background workers or authentication state changes.
- This runbook and Linux/Windows CI gates.

**Code deployment GREEN** means the exact dev/main builds and public Worker HTML/JS/CSS SHA-256 parity pass. The QL-333 immutable public source-manifest audit previously failed and is a separate unresolved source-certification gate. Real source-to-Master operational GREEN cannot be claimed on test signatures or an unchanged static public Worker.

## Independent private Master enrollment contract

\`reviewQl497IndependentMasterEnrollment\` requires a **provider**, **owner** and **independent reviewer** each to sign the same preapproved Master endpoint, existing server certificate SHA-256, independently pinned Master Ed25519 signer public key digest, approved original client mTLS certificate fingerprint, original device enrollment digest and provider-custody digest. Each role must use a **distinct independently enrolled** Ed25519 public key, separate from the Master signer. The three signatures must remain unexpired and within 120 seconds of issue; any mismatched identity, endpoint, revision scope, action or certificate fingerprint returns HOLD. It returns:

\`QL497_THREE_PARTY_MASTER_ENDPOINT_ENROLLMENT_REVIEW_HELD\`

This is a **signed approval review**, not a TLS handshake or proof that an external Master endpoint is installed. It deliberately refuses fake/test/example/localhost/local URLs, HTTP URLs, credentials in URLs and unexpected paths. Its only accepted path is \`/internal/comms/master-delivery-trial\` over HTTPS port 443 or 8443 with valid private DNS.

The signed payload is exactly:

~~~text
schema = rosevear.comms.ql497.independent-master-enrollment.v1
enrollmentId = unique 8–96 character identifier
masterEndpointUrl = actual preapproved private HTTPS Master route
masterCertificateSha256 = independently verified 64-char lowercase SHA256
masterSignerPublicKeyDigest = actual pinned Ed25519 Master key SHA256 fingerprint
clientCertificateSha256 = real original client mTLS cert SHA256
deviceEnrollmentDigest = authentic original-device enrollment digest
providerCustodyDigest = separate trusted provider-custody digest
requestedAction = REVIEW_PRIVATE_MASTER_ENDPOINT_CUSTODY_ONLY
role = provider | owner | independent-reviewer
actorId = three distinct real authorized signer IDs
issuedAtMs, expiresAtMs = recent UNIX milliseconds, <=300 seconds lifetime
customerDataIncluded = false
authorityTransfer = false
~~~

Packet input is exactly \`{providerPacket, ownerPacket, reviewerPacket}\`, each signed as \`{payload,signature}\` with Ed25519 over the same canonical JSON format already used in QL-491–496. The independently enrolled pins are exactly \`providerPublicKeyPem, ownerPublicKeyPem, reviewerPublicKeyPem, masterPublicKeyPem\`. Do not create substitute keys or sign for absent human/provider authorities.

## Independently witnessed original-Windows hardware review

\`reviewQl497IndependentOriginalDevice\` requires genuine QL-496 Master-signed challenge, attestor-signed physical observation, independent owner/reviewer signatures, QL-495 Master-signed trial ACK, plus a **fifth distinct independently enrolled external hardware provider auditor signature**. Its signed hardware payload is exactly:

~~~text
schema = rosevear.comms.ql497.independent-hardware-audit.v1
deviceEnrollmentDigest = authentic separately enrolled original device digest
challengeId = original Master challenge
trialId = exact accepted first-source trial
independentObservationDigest = SHA256 of original signed physical observation packet
masterPacketDigest = SHA256 of exact signed Master receipt
providerActorId = independently authorized external hardware auditor
observedAtMs, issuedAtMs, expiresAtMs = challenge-bound fresh times
requestedAction = INDEPENDENT_HARDWARE_AUDIT_REVIEW_ONLY
customerDataIncluded = false
authorityTransfer = false
~~~

If valid, result is \`QL497_INDEPENDENT_DEVICE_HARDWARE_AUDIT_REVIEW_HELD\` and **\`originalDevicePhysicallyCertified:false\`**. The software verifies independent signatures, but cannot prove from digital evidence alone that the signer personally observed a specific physical machine. An external field certification and custody review is still required.

## Original Windows ↔ independent Master: two-sided signed receipt audit

QL-495 stores private client receipt metadata in \`ql495-master-trial-receipts.ndjson\`; QL-496 stores private Master receipt metadata separately in \`ql496-master-receiver-trial.ndjson\`. The QL-497 independent readers verify each complete private hash chain, sequence, replay, exact record fields, permissions and immutable record hashes, and report only one found trial with its hash.

\`reconcileQl497BidirectionalReceipts\` requires both original journal records, the exact independently Master-signed QL-495 ACK and **two separate** fresh Ed25519 signed readback packets: one from the pre-enrolled original client authority and one from the pre-enrolled independent Master authority. The payloads must identify the same trial, source, receipt ID, QL-495 request digest, QL-494 source record digest, Master packet digest, QL-493 audit digest/head, and both exact client/Master record digests. The readbacks are evidence of signers approving the hashes, **not** an independent network trace.

On matching genuine inputs the result is \`QL497_TWO_SIDED_SIGNED_RECEIPT_AUDIT_RECONCILED_HELD\` with:
- \`ownerClientAndIndependentMasterSignaturesVerified: true\`
- \`independentNetworkPathAudited: false\`
- \`originalDevicePhysicallyCertified: false\`
- \`endToEndDeliveryCertified: false\`
- \`productionMasterAccepted: false\`

Do not copy Master-side receipts into the original Windows private folder and claim independent custody. The files must first originate on separately approved services. No automation or customer delivery is authorized by this audit.

## Owner steps on original DESKTOP-AE894KC

The owner last confirmed \`C:\rc470\` was clean, on \`main\`, and the GitHub origin was correct. No local action is needed to complete QL-497's GitHub release.

After the exact QL-497 \`main\` release is verified, in PowerShell, signed in as Ree:

~~~powershell
Set-Location C:\rc470
git status -sb
git status --porcelain
git branch --show-current
git remote -v
~~~

If there is ANY uncommitted/untracked work, or the branch is not \`main\`, STOP. Do not clean/reset/stash/discard local work. Only on clean \`main\` with the correct remote:

~~~powershell
git fetch origin main
git pull --ff-only origin main
git rev-parse HEAD
node .\runtimes\master-discovery\ql497-original-host-cli.mjs --status
~~~

The SHA should be the exact **verified QL-497 post-merge main SHA**, not old QL-496 \`882341d9be860600da510314297dac413639f0b3\`. The expected status is \`QL497_INDEPENDENT_MASTER_ENROLLMENT_OFF_BY_DEFAULT\`, with no Master enrolled and no network send.

**Optional local read-only evidence inspection**, only if a genuine QL-495 signed Master trial has already been saved to the owner-private client ledger. Substitute the actual known, signed trial ID:

~~~powershell
$privateRoot = Join-Path $env:LOCALAPPDATA 'Rosevear\CommsHub\Private'
Test-Path -LiteralPath $privateRoot
Get-ChildItem -LiteralPath $privateRoot -File |
  Select-Object Name,Length,LastWriteTime
$trialId = 'ACTUAL_EXISTING_SIGNED_TRIAL_ID'
node .\runtimes\master-discovery\ql497-original-host-cli.mjs --local-receipt $trialId
~~~

Do **not** run the placeholder trial ID literally. If the private directory remains empty, the result is HOLD and that is correct. Never post source private certificates/keys, original device signatures or confidential packet bodies in chat.

## Required independent operational work to lift HOLD

The first original source needs independently deployed and verified mTLS infrastructure, genuine QL-494/495 signed receipt and trust custody, and current QL-493 Master audit continuity. The separately controlled Master service must actually install and run the QL-496 contract on an approved private TLS 1.3 listener, own its signing keys outside GitHub, and record a genuine Master-side receipt. Independently enrolled device auditors must issue fresh real challenge-bound evidence; the actual original Windows client receipt and Master receipt must then be reviewed out of band by separate authorized signers.

There is **no evidence** in this code release that those operational steps occurred. We do not generate keys or fake provider connections to simulate success.

## Release acceptance

- Development PR: entire Linux and Windows CI required GREEN.
- Production PR: scoped QL-497 implementation + tests + Windows CLI + runbook + CI only, based directly on prior verified \`main\`; do not merge hundreds of unrelated divergent \`dev\` commits.
- Post-merge exact-main Linux/Windows CI and live public Worker asset SHA-256 parity must all pass before declaring code production GREEN.
- QL-333 source-manifest audit remains an independent unresolved gate unless verified separately.

**Next proposed: QL-498 — Independently Enrolled Original Master Service Activation, Provider-Signed Hardware Ceremony & Cross-Host Receipt Audit Certification.**
