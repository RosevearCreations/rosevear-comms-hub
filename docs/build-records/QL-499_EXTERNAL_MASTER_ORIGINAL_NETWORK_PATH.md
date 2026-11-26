# QL-499 — External Master Runtime Custody, Original Windows Ceremony and Independently Observed Network Path

## What code release GREEN means

This release adds an **opt-in, genuine TLS 1.3 handshake observation** from the
original Windows host to a preapproved independent Master endpoint. It validates
the server's certificate chain and separately pinned SHA-256 fingerprint, using
a local client mTLS certificate. It sends **no HTTP request** and no customer data.
It cannot establish that the independent server *required* the client certificate,
that an application receipt was delivered, or that a physical external auditor
visited the original Windows computer.

QL-499 also verifies distinct signed metadata statements from the original
owner, Master operator, and independent network auditor, each bound to the
QL-498 review digest and actual TLS observation digest. Valid digital signatures
only prove that those signer keys endorsed the statements. They do not independently
prove an observed event happened, and cannot certify a production connection.

Outputs always remain REVIEW_HELD, never production acceptance. There is no
automatic source onboarding, receiver activation, hosted Vercel deployment,
secret creation, credential copying, or customer-write capability. QL-333
independent public source-manifest audit remains unresolved until separately proven.

## Included files

- runtimes/master-discovery/ql499-original-path-probe.mjs — real, bounded,
  non-HTTP TLS 1.3 transport probe; pinned certificate inspection; external
  independently signed review; original QL-497/498 evidence re-verification.
- runtimes/master-discovery/ql499-original-path-probe.test.mjs — synthetic
  handshake and negative signature/identity tests; *never connects* in CI.
- runtimes/master-discovery/ql499-original-host-cli.mjs — safe --status,
  plus **owner-initiated** --probe only on original Windows DESKTOP-AE894KC
  as Ree (not in CI).
- This runbook, plus the existing Linux and Windows release workflow.

## What an actual field ceremony still requires

1. Independently operate and control the real Master service with a valid
   TLS 1.3 listener and client authentication; privately custody and pin
   its signer key and server certificate. No dummy hosts, placeholder
   keys, or simulated provider attestations qualify.
2. Have the original Windows owner obtain genuine QL-497 device challenge,
   independent physical witness and provider hardware-auditor signatures.
3. Obtain QL-498 original raw signed three-party runtime observations.
4. On the original Windows computer, the owner may *deliberately* perform one
   TLS handshake to a preapproved endpoint, after reviewing the exact
   certificate pin and network scope. The handshake is not delivery proof.
5. An independently operated Master, original owner and external network
   auditor must each issue **separate** fresh signed QL-499 observations,
   referring to the exact TLS observation digest and QL-498 evidence digest.
6. Independently compare genuine original-client and Master-side receipts
   and check current QL-333 public source-manifest results before any real
   live operational certification. Keep customer writes and automatic
   sends OFF until the proper owner/provider approval gates succeed.

## Original Windows — safe status and optional owner-supervised TLS observation

From PowerShell as Ree on DESKTOP-AE894KC:

    Set-Location C:\rc470
    git status -sb
    git status --porcelain
    git branch --show-current
    git remote -v

If anything is changed/untracked or not on main, do not reset, clean or
discard it. On clean main with the correct origin only:

    git fetch origin main
    git pull --ff-only origin main
    git rev-parse HEAD
    node .\runtimes\master-discovery\ql499-original-host-cli.mjs --status

Expected status: QL499_ORIGINAL_HOST_MTLS_PROBE_NOT_EXECUTED.
This read-only check never contacts any endpoint.

OPTIONAL SUPERVISED FIELD OPERATION: this cannot be performed from GitHub
Actions or ChatGPT. Only if a real, preapproved external Master service exists,
locally prepare the owner-private directory
%LOCALAPPDATA%\Rosevear\CommsHub\Private and these files (never commit them):

- ql499-owner-approved-probe.json
- ca-bundle.pem (trusted private CA, from the genuine operator)
- client-cert.pem (pre-enrolled original client certificate)
- client-key.pem (original mTLS client key, kept private)

Example JSON structure — **replace every placeholder with genuine values,
do not run the example as-is**:

    {
      "endpointUrl": "https://ACTUAL-PREAPPROVED-HOST/internal/comms/master-delivery-trial",
      "serverCertificateSha256": "ACTUAL_64_LOWERCASE_SHA256",
      "caFile": "ca-bundle.pem",
      "clientCertificateFile": "client-cert.pem",
      "clientKeyFile": "client-key.pem",
      "explicitOwnerApproval": "ONE_SUPERVISED_TLS_HANDSHAKE_NO_HTTP"
    }

The CLI accepts only basenames within that private folder, rejects symbolic
links, validates original Windows owner context, and makes *at most one*
bounded TLS handshake on --probe. On a real private service, the owner can run:

    node .\runtimes\master-discovery\ql499-original-host-cli.mjs --probe

Never paste private keys, complete certificates, signed packets, host login
secrets, or protected source data into chat or GitHub. Read-only results omit
these secrets. A valid probe proves a TLS handshake and observed certificate
to that process only; independent network delivery remains unverified.

## Release gates

Require feature PR Linux+Windows CI; merge dev; separately scoped main PR
Linux+Windows CI; merge main; then exact merged-main Linux+Windows CI and
public Worker JS/CSS SHA-256 parity. The development/production git histories
are significantly divergent; do not merge unrelated dev history into main.

The master runtime and original-Windows field acceptance remain HOLD until
real external evidence exists. Do not use test green as operational acceptance.

Next proposed: QL-500 — Original Master Provider Configuration Discovery,
Signed Live Receipt Custody and Supervised Host-to-Master Acceptance.
