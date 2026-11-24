# QL-492 — Independent Field Witness Receipt Intake, Signed Proof Due-Date Escalations & Source-to-Master Audit Readback

## Scope, authority and safety
QL-492 adds a **private, offline metadata-only** chain that independently rehashes the exact QL-491 intake and signed follow-up custody log; accepts *two separately signed field-witness evidence claims for human review*; records owner + separate reviewer **due-date escalation requests** after the actual QL-491 deadline; and generates a six-source read-only projection addressed to \`rosevear-master\`.

**A digital signature is NOT proof that the original physical device, independently witnessed session, mTLS source endpoint, or actual production source has been physically verified.** The custody record is therefore \`SIGNED_FIELD_WITNESS_CLAIM_INTAKE_HELD\`, not field-certified. Master audit projection is \`OFFLINE_READ_ONLY_NO_SEND\`, with \`masterAcknowledged:false\`, \`originalSourcesVerified:0\` and \`realFieldProofsCertified:0\`. The workflow never sends data to any Master; no source/customer writes, automatic escalations, live network connections, original Windows service starts, or source enrollment occur.

The first real physical field proof still requires independent original-source endpoint implementation/enrollment, genuine independently approved keys, valid private mTLS, and a physical witness procedure. It is NOT unlocked by code deployment.

## User's actual Windows starting point

As of November 24, 2026, QL-491 main code was fetched successfully to \`C:\rc470\`, Node 22.22.3 ran, \`DESKTOP-AE894KC\` / \`ree\` status returned \`originalHostCandidate:true\`; Windows owner-private folder under \`%LOCALAPPDATA%\Rosevear\CommsHub\Private\` was created but **empty** and the local/program data filename search returned \`NO_EXISTING_ENROLLMENT_FILES_FOUND\`. These observations do **not** prove every possible backup location was examined. There are **zero verified live source connections**.

**No local owner action is required for QL-492 code promotion or public Cloudflare asset parity.** Do NOT create fake private trust files, issue self-signed placeholders to impersonate a provider, paste key material into chat/GitHub, or execute field intake based on a test sample.

## When and where — update clean local Windows source code after production promotion (optional)

Only when we want the new commands on the owner PC:

1. On the true original Windows \`DESKTOP-AE894KC\`, sign in as \`ree\`, press Windows Start, type \`PowerShell\`, open it normally.
2. Go to the existing Comms Hub checkout and inspect local edits:

~~~powershell
Set-Location C:\rc470
git status -sb
git status --porcelain
git remote -v
git branch --show-current
~~~

If any uncommitted/untracked change is listed or the current branch is not \`main\`, STOP; do not checkout, clean, reset or pull over it. Only for a **clean \`main\`**:

~~~powershell
git fetch origin main
git pull --ff-only origin main
git rev-parse HEAD
~~~

Compare the full hash against QL-492's exact verified \`main\` GitHub merge SHA (not the earlier QL-491 SHA). Do not presume GitHub deployment updated the Windows machine automatically.

3. Confirm Node 22+ and the safely disabled QL-492 entrypoint:

~~~powershell
node --version
node .\runtimes\master-discovery\ql492-original-host-cli.mjs --status
~~~

Expected: \`QL492_NO_SEND_OFF_BY_DEFAULT\`, \`originalHostCandidate:true\`, \`realFieldProofsCertified:0\`, \`genuineSourceConnectionsVerified:0\`, \`masterDelivery:false\`, \`automaticEscalation:false\`. This command does not inspect private files or contact a source.

## Before any real field review — prerequisites (do not skip)

The already established *genuine* QL-489/490/491 trust config file must be in:

\`$env:LOCALAPPDATA\Rosevear\CommsHub\Private\`

It must have **exactly** the keys:
\`registryDirectory\`, \`evidenceDirectory\`, \`endpoints\`, \`pins\`, \`ownerPins\`, \`reviewerPins\`, \`windowsHostPublicKeyPem\`, \`exceptionPins\`.

The \`evidenceDirectory\` MUST already be a private subdirectory within the same owner root. Existing separately verified \`exceptionPins\` must contain different genuine **public** Ed25519 keys for each permitted source's operator and independent reviewer. No placeholder file or signer-key reuse is acceptable. The private QL-491 journal \`ql491-intake-field-followups.ndjson\` must contain a genuinely authorized, separately signed QL-491 follow-up request with a real \`requestId\`, \`sourceId\`, \`readbackDigest\`, \`captureDigest\`, \`reviewDeadlineAtMs\` and immutable \`recordDigest\`. QL-492 checks the QL-491 journal from the actual disk and its native summary independently.

Check file *names only* on the original owner PC:

~~~powershell
$privateRoot = Join-Path $env:LOCALAPPDATA 'Rosevear\CommsHub\Private'
Test-Path -LiteralPath $privateRoot
Get-ChildItem -LiteralPath $privateRoot -File | Select-Object Name,Length,LastWriteTime
~~~

An empty directory is a **HOLD** for actual field intake. Stay here until the true source endpoints/certificates/reviewers and their QL-491 signed proof follow-up are enrolled through QL-488 → QL-489 → QL-490 → QL-491. **Do not run intake/escalate as a demonstration.**

## Exact private commands ONLY AFTER authentic prerequisites exist

Find the existing real trust config JSON filename in the private directory (do not assume a name). In PowerShell, replace \`EXISTING_TRUST_CONFIG.json\` with the verified real filename:

~~~powershell
$config = Join-Path $privateRoot 'EXISTING_TRUST_CONFIG.json'
Test-Path -LiteralPath $config
~~~

If this prints False, STOP. Once it exists, to display a **private, metadata-only six-source Master-targeted audit** (no network transfer):

~~~powershell
node .\runtimes\master-discovery\ql492-original-host-cli.mjs --audit "$config"
~~~

Expected valid state \`PRIVATE_SOURCE_TO_MASTER_AUDIT_READBACK_HELD\`. It lists six source IDs, request/due/count fields and hash-chain heads, with \`masterDelivery:false\` and \`realFieldProofsCertified:0\`. This **does not send** the report to a Master.

### Optional independently signed proof receipt submission

A separate real authorized operator and *different* independent reviewer must each sign the canonical payload with **their own previously approved and independently pinned** source-specific Ed25519 key. There are no signing commands that generate credentials in this QL-492 release. Use the established trusted signer application/custodian and never expose any key to ChatGPT.

Create exactly a private JSON object of form \`{"ownerPacket":{"payload":{...},"signature":"..."},"reviewerPacket":{"payload":{...},"signature":"..."}}\`, stored in a private file under the owner root, using these **exact payload fields**:

~~~text
schema = "rosevear.comms.ql492.independent-field-proof-intake.v1"
receiptId = unique 8–96 character ID, same in both
requestId = genuine prior QL-491 requestId, same in both
sourceId = exact prior QL-491 sourceId, same in both
followupRecordDigest = immutable prior QL-491 follow-up recordDigest, same in both
readbackDigest = exact prior QL-491 readbackDigest, same in both
captureDigest = exact prior QL-491 captureDigest or null, same in both
observedEvidenceDigest = SHA-256 of actual separately observed evidence, same in both
observedAtMs = UTC Unix milliseconds, after recorded QL-491 follow-up, not future
disposition = "SUBMITTED_FOR_INDEPENDENT_REVIEW_ONLY"
role = "owner" or "independent-reviewer"
actorId = different authorized 8–96 character IDs
issuedAtMs = UTC Unix milliseconds within previous 120 seconds
expiresAtMs = UTC Unix milliseconds in future within 300 seconds of issue
physicalCertificationClaimed = false
customerDataIncluded = false
authorityTransfer = false
~~~

The two packets must both be Ed25519 signed with exact \`canonicalize(payload)\` and base64url signature. Existing signed claim submission cannot be replayed. Do not fabricate an \`observedEvidenceDigest\`: an arbitrary hash is NOT actual observation.

Only with a genuine, approved file and original owner present:

~~~powershell
$proofFile = Join-Path $privateRoot 'ql492-real-signed-proof-pair.json'
Test-Path -LiteralPath $proofFile
node .\runtimes\master-discovery\ql492-original-host-cli.mjs --intake "$config" "$proofFile"
~~~

At the prompt, type exactly \`RECORD ONE SIGNED FIELD REVIEW CLAIM\` if knowingly recording **one** metadata-only review claim. Success returns \`SIGNED_FIELD_WITNESS_CLAIM_INTAKE_HELD\`; no physical certification is granted.

### Optional signed manual due-date escalation

Only when a genuine QL-491 \`reviewDeadlineAtMs\` is **actually past**, two distinct approved signers can approve a one-time private review escalation. It never sends email, SMS, acknowledgments or customer/provider messages.

A private JSON file has the same \`ownerPacket/reviewerPacket\` wrapper; its exact payload fields:

~~~text
schema = "rosevear.comms.ql492.signed-proof-due-escalation.v1"
escalationId = unique 8–96 character ID, same for both
requestId, sourceId, followupRecordDigest = exact prior QL-491 values
reviewDeadlineAtMs = exact QL-491 past due timestamp
proofReceiptDigest = exact previously logged QL-492 proof recordDigest OR null if none
requestedAction = "ESCALATE_DUE_FOR_MANUAL_REVIEW_NO_SEND"
role = "owner" or "independent-reviewer"
actorId = distinct identities
issuedAtMs = UTC Unix milliseconds within 120 seconds
expiresAtMs = UTC Unix milliseconds in future within 300 seconds after issue
customerDataIncluded = false
authorityTransfer = false
~~~

Only when the genuine signed file exists and a deliberate manual owner request is intended:

~~~powershell
$dueFile = Join-Path $privateRoot 'ql492-real-signed-due-pair.json'
Test-Path -LiteralPath $dueFile
node .\runtimes\master-discovery\ql492-original-host-cli.mjs --escalate "$config" "$dueFile"
~~~

At the prompt type exactly \`RECORD ONE SIGNED DUE REVIEW NO SEND\`. \`SIGNED_PROOF_DUE_REVIEW_ESCALATION_HELD\` means the **private request** was recorded. It does not dispatch a message or mark the external review completed. Do not run it just to turn the console GREEN.

## Acceptance and limitations

Linux and Windows QL-492 regression gates cover real QL-491 journal correlation, cross-source rejection, independent signature and role verification, stale clocks, unsigned claims, claims of physical certification, replay, premature due-date rejection, stale receipt digests, tampering, and silent six-source Master projection. They use **synthetic test identities only**, which cannot count as field acceptance.

Production GREEN requires both PR merges, exact main head, successful post-merge Linux/Windows suite and public Cloudflare Worker JS/CSS parity. Static site parity **does not prove six live application receivers or endpoints**. Existing scheduled six-source manifest audit or real original-Windows field HOLDs remain independently visible.

**Next proposed:** QL-493 — Verified Private Source Endpoint Readiness, Original-Host mTLS Enrollment Prerequisites & Independent Master Receipt Handoff.
