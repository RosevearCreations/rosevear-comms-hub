# QL-491 — Exception Intake, Original-Host Field Proof Follow-Up and Recovery-Drill Trends

## Production versus field certification

QL-491 independently reconciles QL-490 six-source receipt and genuine signed OPEN exception metadata. It persists only intake counts, evidence digests and separately signed original-host FIELD-PROOF FOLLOW-UP requests to a private fsynced hash-chained replay-rejecting journal. QL-491 also independently rehashes the QL-490 no-send drill ledger and reports seven-day, prior-week, 30-day and all-time simulated-rehearsal counts.

This release **never** enrolls a source, starts a receiver, performs a recovery, sends customer/provider messages, touches customer accounts, certifies any physical Windows witness or issues live field authorization. QL-491 code passing CI/public Cloudflare Worker parity is not proof that the actual six source installations have been personally inspected. Field proof remains HOLD until genuinely collected and independently reviewed.

## Does anyone have to do anything for the GitHub release?

**No.** The automated CI tests, scoped PR promotions and static public Worker SHA-256 parity require no local Windows action. The steps below are for *optional later* original-machine private data readback and one specifically authorized field-proof follow-up request. This computer must be the genuine owner Windows machine; GitHub CI and a second computer cannot run field actions.

## When, where and how: step-by-step on Ree's original Windows PC

### Step 1 — Locate source code, avoid loss of any local changes

Where: Windows **Start → PowerShell**, logged on to user 'ree' on **DESKTOP-AE894KC**. Use the known local Comms Hub workspace **C:\rc470** (not a drive copy for another app). In PowerShell, run:

~~~powershell
Set-Location C:\rc470
git status -sb
git status --porcelain
git remote -v
git branch --show-current
~~~

If the porcelain command prints **any** modified/untracked files, STOP. Do not pull/reset/clean/checkout or lose local edits. If this is not the correct RosevearCreations/rosevear-comms-hub Git repository, STOP. For a clean checkout on main only:

~~~powershell
git fetch origin main
git pull --ff-only origin main
git log -1 --oneline
~~~

The full SHA must match the verified **QL-491 main production merge SHA** from GitHub. GitHub merges alone do **not** update C:\rc470. If the local branch is not main or fast-forward fails, stop and request a scoped reconciliation rather than discarding work.

### Step 2 — Verify Node and that the new tool starts safely

~~~powershell
node --version
node .\runtimes\master-discovery\ql491-original-host-cli.mjs --status
~~~

Node.js 22 or later. Expect QL491_NO_SEND_OFF_BY_DEFAULT, providerConnections=0, realFieldProofsCertified=0, customerWrites=false. This is a status check only; it neither proves physical host identity nor sets up credentials.

### Step 3 — Find existing private trust, never invent it

The same genuine six-source trust config already required by QL-489/490 must be present under the *current user* private root. In PowerShell:

~~~powershell
$privateRoot = Join-Path $env:LOCALAPPDATA 'Rosevear\CommsHub\Private'
Test-Path -LiteralPath $privateRoot
Get-ChildItem -LiteralPath $privateRoot -File | Select-Object Name,Length,LastWriteTime
~~~

This lists **file names only**. Do not paste the actual private configuration, certificates, tokens, PEMs, signed packets, or customer data into chat, GitHub or logs. If the directory is missing, STOP: no real private source enrollment is complete.

Find the actual existing QL-489/490 trust JSON filename in that listing. It has exactly these top-level keys: registryDirectory, evidenceDirectory, endpoints, pins, ownerPins, reviewerPins, windowsHostPublicKeyPem and exceptionPins. Do NOT use a guessed filename, fabricate configuration or generate fake Ed25519 evidence to pass the check.

After confirming the actual filename, set the variable using the real name (replace PLACEHOLDER_EXISTING_TRUST.json with the real name):

~~~powershell
$config = Join-Path $privateRoot 'PLACEHOLDER_EXISTING_TRUST.json'
Test-Path -LiteralPath $config
~~~

If Test-Path is False, STOP. The configured registryDirectory and evidenceDirectory must already exist inside the same private root.

### Step 4 — Prepare ONLY genuine signed exception-open inventory

QL-491 is allowed to reconcile an empty case inventory if no genuine QL-490 operator-signed OPEN cases exist; an empty case list never implies six certified sources. A new local empty JSON file is safe for that situation:

~~~powershell
$cases = Join-Path $privateRoot 'ql491-signed-open-cases.json'
if (-not (Test-Path -LiteralPath $cases)) {
    Set-Content -LiteralPath $cases -Value '[]' -Encoding utf8
}
Get-Item -LiteralPath $cases | Select-Object FullName,Length
~~~

If the real owner already has signed QL-490 OPEN packets, use the authorized process to export those entire signed packet envelopes into the private JSON array instead. The source and signing schema is in the QL-490 build record. Do not substitute dummy packets, screenshots, expired signatures or manual claims. Never overwrite an existing genuine case inventory with the empty file.

### Step 5 — Run private, offline durable exception reconciliation

~~~powershell
node .\runtimes\master-discovery\ql491-original-host-cli.mjs --review "$config" "$cases"
~~~

Successful metadata custody returns state SIGNED_CASE_INTAKE_RECONCILED_REVIEW_HELD. Inspect caseCount, openCount, overdueCount, closedCount, unmatchedClosures and sourceHoldCount. A positive sourceHoldCount or unmatchedClosures remains a **field HOLD**, even when intake metadata is durably recorded. No external calls, recovery or auto-escalation occur.

If output is HOLD, preserve the reason code. Do not edit an original source journal or insert artificial data to make counts appear correct.

### Step 6 — Independently review no-send drill trend history

~~~powershell
node .\runtimes\master-discovery\ql491-original-host-cli.mjs --trends "$config"
~~~

PRIVATE_INDEPENDENT_NO_SEND_DRILL_TRENDS_HELD means the original private QL-490 no-send ledger chain agrees with its own integrity checker. Counts describe supervised **tabletop rehearsals, not restores or successful physical recovery**. Zero drill records is not evidence of zero incidents; a missing journal may legitimately mean none have been performed. Any tamper or disputed count returns HOLD.

### Step 7 — OPTIONAL: create one real, separately signed field-proof review request

Do this ONLY when the original owner wants to schedule an actual independently witnessed verification of a particular source. A follow-up request does not complete that verification. There is no default signing key, automatic co-signing or fake second reviewer.

The request must be a private JSON object with exactly the keys: sourceId, ownerPacket, reviewerPacket.

The ownerPacket and reviewerPacket each contain exactly {payload, signature}. Both signatures are Ed25519 base64url over the canonical JSON payload, using the ALREADY independently pinned operator and independent reviewer signing keys for the selected source. They must be signed by **different authorized people/keys**.

Both payloads must have exactly these fields:

~~~text
schema: rosevear.comms.ql491.signed-field-proof-follow-up.v1
requestId: unique ID of 8–96 letters/numbers/underscore/hyphen, same for both
sourceId: one of the six exact QL-485 source IDs, same for both
readbackDigest: fresh private QL-490 readbackDigest, same for both
captureDigest: that source's lastCaptureDigest or null, same for both
requestedAction: INDEPENDENT_ORIGINAL_HOST_FIELD_PROOF_REVIEW_ONLY
role: owner in ownerPacket; independent-reviewer in reviewerPacket
actorId: distinct authorized identities, 8–96 letters/numbers/underscore/hyphen
issuedAtMs: UTC Unix milliseconds, no earlier than 2 minutes before use
expiresAtMs: future Unix milliseconds, no later than 5 minutes after issue
reviewDeadlineAtMs: future Unix milliseconds, no later than 7 days after issue
physicalWitnessCompleted: false
customerDataIncluded: false
authorityTransfer: false
~~~

Source, requestId, readbackDigest, captureDigest, reviewDeadlineAtMs must match between both signed payloads. Do not copy or share a private key just to satisfy two signatures. Store the signed request file only within the private root.

Example command using an existing legitimately signed private file named ql491-one-field-review-request.json:

~~~powershell
$request = Join-Path $privateRoot 'ql491-one-field-review-request.json'
Test-Path -LiteralPath $request
node .\runtimes\master-discovery\ql491-original-host-cli.mjs --followup "$config" "$cases" "$request"
~~~

When the tool prompts, type exactly REQUEST ONE FIELD PROOF REVIEW (NO SEND), *only* if intending to record one offline proof follow-up. A valid request yields DURABLE_SIGNED_FIELD_PROOF_FOLLOWUP_HELD, never a physical witness certificate. If no genuine independent reviewer is available, skip this step; the case remains HOLD. The tool does not book/schedule an external reviewer; due date is merely recorded.

### Step 8 — Read the output without sharing secrets

Share only safe state, reason code, counts or short Git SHA for follow-up support. Keep keys, signed envelopes, certificates, private URLs, customers and full trust JSON private. Never run git reset --hard or git clean on C:\rc470 as a shortcut; preserve local state for reconciliation.

## Acceptance checklist

- Linux/Windows QL-491 regression suite rejects forged case inventory, custody tampering, stale approvals, cross-source follow-up, replay, and original-host CI actions.
- No live source or Windows physical certification is inferred from a digest, scheduled request or simulated recovery record.
- Development PR merges to dev; scoped main PR contains only these QL-491 implementation, test, doc and workflow files. Never merge dev's diverged unrelated history wholesale.
- GitHub post-merge workflow and public Worker JS/CSS SHA-256 parity both pass for exact main commit.
- Any original-host physical/source proof remains HOLD until the real original device and two independent participants supply verifiable evidence.

**Next proposed: QL-492 — Independent Field Witness Receipt Intake, Signed Proof Due-Date Escalations & Source-to-Master Audit Readback.**
