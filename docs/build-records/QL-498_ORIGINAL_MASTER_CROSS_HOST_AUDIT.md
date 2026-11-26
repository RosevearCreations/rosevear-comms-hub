# QL-498 — Original Master Service Activation Evidence and Independent Cross-Host Audit

## Scope and truth boundary

QL-498 adds an independently signed, fail-closed runtime evidence review for the
separately operated private Master service. **It does not install or start that
service, configure TLS, issue credentials, enable a receiver, enroll original
hardware, or independently certify network or physical events.** GitHub CI
cannot observe the owner's Windows computer or an external provider site.

The difference matters: code deployment can be GREEN while original service
activation, physical device certification, QL-333 source manifest acceptance,
and end-to-end delivery remain HOLD.

## Included code

- runtimes/master-discovery/ql498-cross-host-runtime-evidence.mjs
  reviews three *separately* signed runtime observation claims bound to QL-497
  enrollment, hardware and two-sided receipt digests; rejects changed TLS pins,
  replay-looking stale claims, duplicate actors, duplicate witness keys and
  cross-host digest mismatches.
- runtimes/master-discovery/ql498-cross-host-runtime-evidence.test.mjs
  contains synthetic positive review-HOLD and negative regressions.
- runtimes/master-discovery/ql498-original-host-cli.mjs
  supports only --status. It does not send, activate, sign, or read secrets.
- This runbook, and explicit Linux and Windows CI gates.

The higher-level reviewQl498WithOriginalEvidence function **reverifies the
raw QL-497 signed enrollment, original-device and signed receipt inputs**
instead of accepting a previous caller-provided review flag. A valid result is
QL498_GENUINE_SIGNED_EVIDENCE_REVIEW_HELD. It still NEVER certifies a live
TLS route, physical observation, successful source delivery, or Master
activation. A valid digital signature is evidence of a signer's statement,
not proof of external physical conditions.

## Authorized external ceremony prerequisites

1. Identify the actually operated independent Master TLS 1.3 endpoint, its
   preapproved server certificate SHA-256 and independently controlled Master
   signer key. Do not invent a DNS name, fake certificate or use test keys.
2. Obtain independent provider, owner, and reviewer signatures matching the
   genuine QL-497 enrollment, with all signer keys separately pinned.
3. On original DESKTOP-AE894KC, obtain a real, fresh challenge-bound hardware
   observation by the authorized physical attestor. Have an external hardware
   auditor inspect and sign evidence independently of the owner and Master.
4. Verify the independently maintained QL-495 original-client journal and
   QL-496 separate Master journal. Require two independent signed readbacks
   over exact matching original source, request and receipt digests.
5. Collect three distinct signed QL-498 runtime reports from Master operator,
   original Windows owner and independent provider, each with independent
   observation digest, matching service instance and Master TLS fingerprint.
6. Perform an actual external network-path test, original-host review, and
   independent provider release decision OUTSIDE this code review. This
   cannot be fabricated by a GitHub Actions runner.
7. Keep receiver OFF, production sends OFF and customer writes OFF until
   appropriate source and network approvals are genuinely complete.

Do not paste passwords, private keys, certificate private material or private
receipt packets into chat or GitHub.

## Original Windows read-only verification

Use PowerShell on DESKTOP-AE894KC as Ree. The folder C:\rc470 was previously
reported as clean; check again rather than assuming.

    Set-Location C:\rc470
    git status -sb
    git status --porcelain
    git branch --show-current
    git remote -v

If there are uncommitted or untracked changes, or the branch is not main,
STOP. Never reset, clean, stash or overwrite work without inspecting it.
On a clean main and correct origin only:

    git fetch origin main
    git pull --ff-only origin main
    git rev-parse HEAD
    node .\runtimes\master-discovery\ql498-original-host-cli.mjs --status

Compare HEAD to the exact QL-498 postmerge production SHA recorded in GitHub.
The expected read-only output is
QL498_MASTER_RUNTIME_ACTIVATION_NOT_ENROLLED. This is correct until genuine
external Master operation and field acceptance occur.

## Release gates

- Merge development PR only after its full Linux and Windows CI succeeds.
- Avoid sweeping dev into main; the two branches have extensive unrelated
  history divergence. Transplant only the five QL-498 files to a scoped main
  candidate based on the previously verified QL-497 production commit.
- Merge main only after candidate Linux and Windows CI succeeds.
- Require postmerge exact-main Linux/Windows CI and public Worker JS/CSS
  SHA-256 parity before reporting code release GREEN.
- No Vercel project is linked to this GitHub repository in the inspected team.
  Do not claim Vercel production deployment from a GitHub merge.
- QL-333 original public source-manifest audit remains independently unresolved.

Next proposed: QL-499 — External Master Runtime Custody Enrollment, Original-
Windows Field Ceremony and Independently Observed Network-Path Acceptance.
