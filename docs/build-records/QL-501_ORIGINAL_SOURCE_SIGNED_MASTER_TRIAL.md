# QL-501 — Original Source-Signed Master Trial, Independently Signed Provider ACK and Release HOLD

**Source of Truth applied:** Rosevear_All_Applications_Source_of_Truth (user-provided 26 November 2026), especially "Instructions for each application build", "Three Masters", "Rosevear Comms Hub" and "Distinctive features to pilot after the core journeys work".

## Release boundary and customer outcome

This build adds a real, one-shot *optional* original-Windows client path for a
source-signed **noncustomer metadata** trial to a separately operated Master
TLS 1.3 endpoint. The original source signs the exact trial packet with its
own, previously enrolled Ed25519 key. The remote provider contract requires
a pinned client mTLS certificate and a *durable provider-side journal*
before independently signing its ACK. A third, distinct independent reviewer
can sign a **HOLD**, not a release. All signatures are checked against
preapproved pins; the source tenant, event/version, trial ID, source packet
digest, expiry and receipt ID are bound.

The original operator can initiate **one** attempt; an fsynced local journal
reserves the trial **before** network I/O. Uncertain delivery is a distinct
FAILED_OR_UNKNOWN entry and is **not automatically retried**. Reusing the
same trial ID is blocked, including after a crash between reservation and
response. Failed writes, altered hash chains and missing files fail closed.

A signed provider ACK from a synthetic test proves only that the fixture's
key signed data. An ACK actually observed over TLS proves only the client
received a valid provider response to a single metadata request.
Neither proves a human customer saw instructions, nor guarantees source
authorization, physical host identity, provider app delivery to customers,
or independent third-party network observation. No production hold is
released automatically.

## Implemented software

- runtimes/master-discovery/ql501-source-signed-delivery-trial.mjs:
  exact source packet schema/Ed25519 verifier, pinned provider ACK verifier,
  three-key independent HOLD review, genuine guarded HTTPS/mTLS one-shot
  transport and opt-in separate Master receiver SDK adapter (no listener)
- runtimes/master-discovery/ql501-private-trial-journal.mjs:
  crash-safe metadata-only reservation/outcome with fsync, duplicate suppression
  and tamper detection; no private keys or customer payloads
- runtimes/master-discovery/ql501-original-host-cli.mjs:
  completely inert --status and original Ree Windows-only --supervised-trial
- runtimes/master-discovery/ql501-source-signed-delivery-trial.test.mjs:
  synthetic independent signatures, rejected cross-tenant/expired/forged ACKs,
  unapproved customer data and source version, original mTLS boundary,
  durable reservation/replay and CLI safety
- scripts/ql501_source_of_truth_python_checks.py:
  actual JavaScript CLI + cryptographic verifier exercised from Python;
  no mock browser login claimed
- Linux and Windows GitHub CI gates (plus existing application/Vitest suite)
- this release and field-acceptance runbook

## Original Windows steps — no owner involvement needed for GitHub release

At the original DESKTOP-AE894KC Windows PC, as Ree, *when convenient*:

    Set-Location C:\rc470
    git status -sb
    git status --porcelain
    git branch --show-current
    git remote -v

If uncommitted work is present, or the branch/remote is unexpected, STOP.
Do not reset, clean, stash or overwrite owner files. Only from clean main
with origin RosevearCreations/rosevear-comms-hub:

    git fetch origin main
    git pull --ff-only origin main
    git rev-parse HEAD
    node .\runtimes\master-discovery\ql501-original-host-cli.mjs --status

Status does not contact the Master or inspect secret files.
Expected state: QL501_SUPERVISED_SIGNED_TRIAL_NOT_RUN.

### Optional original-host supervised field ceremony (NOT part of CI)

Do **not** perform until an actually operated, authorized independent Master
has installed the QL-501 receiver SDK, authenticated preapproved source
identity/tenant scope, durable provider journal and *independent provider
signer*. No service is auto-created by this code.

Privately maintain the genuine QL-499/500 mTLS cert and CA material, plus
an original **source-application** Ed25519-signed metadata-only trial and
three *public* preapproved Ed25519 verifier keys. Never create signing
authority in the Comms Hub, and never use generated CI test keys in field use.

Place configuration and files under
%LOCALAPPDATA%\Rosevear\CommsHub\Private (never GitHub/chat).
The JSON file name must be exactly **ql501-owner-approved-trial.json**.
Its exact keys are endpointUrl, serverCertificateSha256, caFile,
clientCertificateFile, clientKeyFile, sourcePacketFile, sourcePublicKeyFile,
providerPublicKeyFile, reviewerPublicKeyFile, sourceId,
tenantScopeDigest, explicitOwnerApproval.
All file fields are safe private-directory basenames, not paths.
The endpoint is the same approved host and certificate pin as QL-500,
with path /internal/comms/master-source-signed-trial.
Only after checking the genuine provider's deployment, set
explicitOwnerApproval to ONE_SOURCE_SIGNED_PRIVATE_TRIAL_HOLD_ONLY.

The sourcePacketFile must contain the **actual original source-signed**
QL501 trial packet; no generated or invented signature qualifies.
The client source packet contains only opaque identifiers, tenant/event
SHA-256 digests, version, purpose, timestamps and no customer details.
After an owner authorization, only on the original Windows machine:

    node .\runtimes\master-discovery\ql501-original-host-cli.mjs --supervised-trial

It makes at most one mTLS HTTP POST. The private audit reserves the trial
first; a timeout is FAILED_OR_UNKNOWN, never interpreted as undelivered or
retried under the same trial ID. The CLI prints redacted digests, no private
keys or customer data.

A real provider service must independently install/operate a TLS listener,
authenticate client certificates, implement the QL-501 SDK handler with
durable reserve/commit and pinned source signer, and deliver its own
signed ACK. The Comms Hub does not start that service.

## Distinct states in Source of Truth acceptance

| Stage | Evidence needed | This build's truthful result |
|---|---|---|
| Saved local request | Source-signed packet and fsynced original journal reservation | Possible via manual original-host trial; never assume live |
| Provider transport and receipt | One actual pinned TLS 1.3 request plus independent provider signer and durable ACK | SDK + guarded path built; NOT observed from this chat |
| Human acknowledgement | Customer identity/role/brand-scoped reply from owning product | Not implemented by this trial; remains unverified |
| Unresolved replies | Tenant-locked inbound provider thread with current version | Not demonstrated; next workflow gap |
| Production HOLD release | Independent original-host physical witness, real provider network evidence, QL-333 original manifest, dual owner approvals | HOLD, no automatic release |

## Test evidence classifications

- GitHub Linux/Windows tests use **synthetic local keys** and fake sockets
  for negative/positive crypto and replay regressions. They do not execute
  the original Windows trial or contact a private provider.
- Python integration executes the real offline Node CLI and verifier against
  signed test fixtures. This is NOT a physical host or browser journey.
- No linked Vercel project for Comms Hub was identified in connected context.
  The GitHub Pages/preview evidence currently describes a disabled/synthetic
  interface; no authenticated live user browser journey can be claimed.
- The test tenant, independent provider and original Windows site must be
  verified before field certification.

## First verified next app workflow gap — QL-502 candidate

**QL-502 — Brand-Scoped Delivered-Version Timeline, Superseded Instruction
Reply Handling and Provider-Acknowledgement Truth.**
Existing QL-192/QL-314 inbox is a synthetic preview; repository search
does not establish a real, provider-delivered version history. Build the
first verified missing operator task, not another abstract certificate.

Acceptance, from the attached Source of Truth:
1. In isolated Camp Rosevear test accounts, send *controlled* arrival-gate
   instructions version 1, change the gate, issue version 2, then have the
   guest reply to version 1.
2. Staff see version 1 actually provider-delivered versus saved-only;
   version 2 supersedes it and the reply stays attached to the correct
   campground, stay, channel and original message.
3. A staff reply must use the current instructions and the Camp Rosevear
   brand, never another tenant's sender or contents.
4. Test an opted-out recipient, a cancelled add-on, an expired offer, a
   disputed invoice line and a provider outage. Recheck authorization,
   consent, version and expiry on delayed retries.
5. Distinguish saved request, provider delivery, human acknowledgement
   and unresolved reply. Verify two independent test sessions, mobile/
   tablet/desktop, replay duplicates and a second tenant denied.
6. Keep provider messaging disabled until real provider/test-recipient
   authorization. A mock/JS DOM test can establish UI logic only, not
   an actual carrier delivery.

**Queue interpretation:** The historical GitHub issue QL-459–472 contains
14 unchecked boxes, but later QL-500 releases overtook those numbers.
Do not report those as 14 new builds remaining. The Source of Truth defines
no finite total remaining. Count live approved next builds separately from
open coordination/issues and record their verified state.

Next proposed QL-502 is **not implemented or promoted by QL-501**.

## Promotion verification

Dev Linux and Windows CI, scoped main candidate CI and exact-main postmerge
Linux, Windows and Worker JS/CSS SHA-256 parity must succeed.
Vercel deployment or actual provider field service cannot be inferred from
GitHub code checks.
