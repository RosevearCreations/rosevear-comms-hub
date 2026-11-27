# QL-502 — Branded Delivered-Version Truth and Superseded Reply Handling

26 November 2026. Applied Source of Truth: Rosevear_All_Applications_Source_of_Truth, especially Three Masters, Shared Customer Journey, Automated Testing and distinctive Comms Hub delivery-history feature.

## Delivered code — and what it does NOT prove

- The existing QL192/314 four-brand inbox includes an iCamp-only, clearly
  labelled **fictional** operator rehearsal for Camp Rosevear. Choose saved
  only, changed gate v1-to-v2, reply to obsolete v1, opted out or provider outage.
- Every step shows its version, state and required next review action.
  Nothing sends, persists customer details or grants brand/tenant access.
- Source and provider Ed25519 signatures can be independently validated.
  Source message ID, version, content hash, tenant/thread hashes,
  provider ACCEPTED and separate DELIVERED receipts, actual signer pins,
  expiry and signed obsolete-version reply are checked. Replays, cross-tenant,
  forged signatures, outdated versions and out-of-order receipts fail closed.
- A provider-accepted receipt is NOT delivery. A provider-delivered signed
  claim is NOT proof that any human read it. QL501 Master ACK is NOT customer
  delivery. Review stays HOLD without actual third-party and original-host
  evidence. No production message sends or invoice writes.
- JS DOM/Vitest exercises actual QL192 inbox; Node tests verify cryptographic
  contracts; Python drives Node cross-language negative cases. No live
  authenticated guest/staff browser session or actual private Master was
  available during CI. Phone/tablet/desktop real-device check remains HOLD.

## Full owner field acceptance procedure — in order

### A. Synchronize the actual Windows original host

1. Open the exact QL502 main GitHub Actions workflow. Verify app/Linux,
   Windows original-owner and Worker JS/CSS SHA256 parity are SUCCESS
   on the exact current main commit. Candidate green is insufficient.
2. On DESKTOP-AE894KC, logged in as Ree, open PowerShell.
3. Enter these commands, one at a time or as a single safe block:

        Set-Location C:\rc470
        git status -sb
        git status --porcelain
        git branch --show-current
        git remote -v

4. STOP if status includes uncommitted/untracked changes, branch differs
   from main, or origin is not
   https://github.com/RosevearCreations/rosevear-comms-hub.git
   Do NOT reset, clean, stash or overwrite.
5. For clean main and correct origin only, run:

        git fetch origin main
        git pull --ff-only origin main
        git rev-parse HEAD
        node .\runtimes\master-discovery\ql501-original-host-cli.mjs --status
        node .\runtimes\master-discovery\ql500-original-host-cli.mjs --status

6. Status commands are read-only and network-inert. GitHub code deployment
   does not automatically update or enroll the Windows runtime.

### B. Supply a real independently operated Master provider

1. Confirm the actual independently controlled Master endpoint, service
   custodian, original HTTPS/TLS1.3 mTLS host, issued CA and pinned server
   SHA256 certificate fingerprint. The GitHub repo does NOT run it.
2. Independently enroll original Windows client certificate, the source
   business Ed25519 signer public key and the distinct provider-side
   Ed25519 signing key. Provider private key must stay with provider.
3. Provider deploys the QL501 one-shot source trial endpoint with durable
   reserve/commit, replay protection and signed ACK. DO NOT assume a source
   manifest, GitHub test or cloud preview proves it is installed.
4. In the original Windows private config directory (LOCALAPPDATA then
   Rosevear\CommsHub\Private), maintain the genuine existing QL499/QL500
   CA, mTLS cert/key and approved server fingerprint. Never publish keys.
5. With genuine existing provider configuration, owner may run:

        node .\runtimes\master-discovery\ql500-original-host-cli.mjs --inventory

6. Compare results to the provider's independent enrollment. A HOLD is
   not an error to bypass with dummy files. Keep QL340C receiver OFF.
7. Only after separate owner approval and real source signer availability,
   review the QL501 one-shot trial runbook. Its owner-approved private file
   is ql501-owner-approved-trial.json. Exact field keys are endpointUrl,
   serverCertificateSha256, caFile, clientCertificateFile, clientKeyFile,
   sourcePacketFile, sourcePublicKeyFile, providerPublicKeyFile,
   reviewerPublicKeyFile, sourceId, tenantScopeDigest,
   explicitOwnerApproval. Never fill unknown details with placeholders.
8. The original Windows supervised trial command, ONLY if separately
   authorized with genuine independently provisioned credentials, is:

        node .\runtimes\master-discovery\ql501-original-host-cli.mjs --supervised-trial

9. It must send only one signed noncustomer metadata trial. A timeout is
   FAILED_OR_UNKNOWN; do not replay its trial ID. Preserve only approved
   nonsecret signed digest evidence. Live source authorization, physically
   observed host, independent provider operation and QL333 manifests
   remain separate acceptance gates.

### C. Provide genuine scoped test accounts and a controlled recipient

1. In iCamp Camp Rosevear, prepare a real authorized test stay at Site 12
   with fictional gate instructions. Create two separate authorized test
   accounts: Site 12 guest; campground staff. Verify guest sees only their
   stay and staff sees only their own campground.
2. Provision Comms Hub operator membership via the secure identity path.
   A Comms brand switcher or one app_admins database row is not proof
   of an authenticated operator or campground tenant permission.
3. Approve one private nonproduction mail/SMS sender and controlled
   recipient; confirm webhook signer and callback identity, expiry,
   consent and channel-specific requirements. Do not send real customers
   unapproved communications. Never put provider secret/API key, PEM
   private key or login password in chat/GitHub.
4. Keep real customer messages and full financial details in the
   owning application, not the Master summaries.

### D. Run the complete Site 12 message-history test

1. Sign in as guest on a mobile-sized browser and staff on a separate
   tablet-sized browser; verify desktop. Record each viewport and whether
   actual device or emulator. Obtain genuine iCamp stay membership.
2. Staff issue arrival-gate instructions v1 to controlled test recipient.
   Capture owning product event ID and immutable version/content digest.
3. Check Comms shows SAVED; collect actual provider acceptance receipt
   separately. Claim DELIVERED only if the provider confirms that state
   with independently validated evidence. Do not infer human read.
4. Change the arrival gate in iCamp. Version v2 must supersede v1 without
   erasing v1 history or source. Recheck current consent, stay, version,
   expiration and provider state before attempting an approved v2 send.
5. Guest replies to the old v1. Staff in Camp Rosevear see the reply
   against v1, v2 as current, the brand, an unresolved action owner and
   a clear version warning. Staff reply using current v2 instructions
   only after own-tenant permission checks.
6. Repeat with another campground: a guest or staff account must not
   read or reply in the other tenant. Duplicate provider callback,
   stale event, opt-out, cancelled add-on, filled slot, disputed charge,
   expiry and provider outage must not produce a wrong send/charge.
7. Disconnect and reconnect. The real backend (not the QL502 synthetic
   panel) should rehydrate saved messages, receipts and replies, with
   timestamps and an independently checkable provider reference.
8. Compare saved, accepted, delivered, human response and unresolved
   reply separately. Record redacted refs, observed time, failures,
   cross-role denials, rollback and original receiver OFF observation.

### E. Clear the old GitHub issue queue correctly

1. Classify every open issue as historical handoff, genuine current
   workflow gap, physical field dependency or branch-cleanup task.
2. Preserve live missing evidence in an ACTIVE field/dependency tracker
   before closing an older snapshot.
3. Historical or superseded handoff records can be closed as NOT PLANNED
   / SUPERSEDED, with a note pointing to the active tracker. That is
   administrative closure, NOT live integration or field certification.
4. Keep current original Windows/provider/cross-app incident issues open
   until their independent signed evidence is present. Do not invent
   completed acknowledgements to reduce the issue counter.
5. For merged branches, verify the exact current branch SHA and merged PR
   before deleting. Keep main, dev and uncertain/unmerged work. The
   connected GitHub tool has no branch deletion capability; owner
   permissions are required for branch cleanup.
6. Recount open GitHub issues after cleanup; never describe issue count
   as all remaining software builds.

## Field release HOLD

GitHub GREEN applies only to code and tests. No automatic receiver,
customer messaging, owner privilege, production Master connectivity,
physical original-host certification or external recipient delivery.
Do not interpret a synthetic test as a real guest pilot.

Next proposed work: QL503 — Server-authorized, tenant-persistent
provider-delivered version timeline and genuine inbound old-version
reply reconciliation with controlled real test accounts. Not completed
by QL502.

Implementation sources: the owner's 26 Nov Source of Truth; prior
QL192/314 synthetic inbox records, QL501 original source-signed trial,
and current GitHub issue/branch metadata.
