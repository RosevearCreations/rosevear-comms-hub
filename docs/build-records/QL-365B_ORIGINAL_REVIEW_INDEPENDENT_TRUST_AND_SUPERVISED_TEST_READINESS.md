# QL-365B — Original-device signature reconciliation and independent TEST readiness

## Status and strict separation of authorities

QL-365B verifies *another* separately signed, original-key review of the **exact**
QL-365A dual-owner first-time candidate. It can then verify independently pinned,
distinct external `policy_reviewer` and `field_witness` offline review decisions,
if genuine, separately administered identity/pin/custody services are supplied.

**Nothing in this build changes live trust or permission.** The independent original
issuer and field witness from the legacy QL-355 enrollment procedure are still
unverified. The new first-time policy is a separate, owner-supervised candidate:
it does not silently satisfy QL-355, QL-354 or QL-357 or authorize their runtime
operations. A PASS in synthetic CI cannot supply a real issuer, independent
reviewer, signer, original-host witness, database login, private TEST receipt,
receiver, Tailnet gateway or six-app connection.

All QL-365B output states carry `databaseEnrollmentAuthorized: false`,
`receiverActivated: false`, `supervisedTestAuthorized: false`,
`sixAppGrantsAuthorized: false`, `customerCommunications: false`,
`deviceActions: false` and `connected: false` (`DISCONNECTED / HOLD`).
The original receiver port `8788`, Tailnet Serve and PostgreSQL `NOLOGIN`
role remain unchanged. A QL-342A inert rollback is **not** a witnessed real STOP.

## Prerequisites on the two original Windows computers

- Original **Ree** PC: `DESKTOP-AE894KC`, Windows account `ree`, local repository
  `C:\Users\ree\rosevear-comms-hub-current`.
- Original **Jack** PC: `TEMPLAR`, Windows account `jfros`, local repository
  `C:\Users\jfros\comms-current`.
- Node 22+; protected QL-365B source code from `main`; the *genuine* QL-365A
  signed candidate assembled from both original keys within its original 20-minute
  window, with the four original file witnesses and fresh QL-344 initial receiver-OFF
  observation. No copied or regenerated owner key can stand in for the original.
- Both owners available to review and sign before the candidate expires. If expired,
  stop. Preserve existing signed records; do **not** overwrite them, reset timestamps
  or re-label synthetic evidence as original.

Never provide private keys, passphrases, private operator tokens, passwords or
database credentials to ChatGPT, GitHub issues or other PCs.

## Step-by-step: original-device readback, review and reconciliation

1. **Both PCs — update only if worktree is clean.** In their own PowerShell at the
   path above:

   ```powershell
   git status -sb
   git fetch origin
   git pull --ff-only origin main
   node .\runtimes\hub-relay\ql365b-original-review-cli.mjs --status
   ```

   Stop if changes would be lost, or if `originalOwnerRole` is not `source` for
   Ree or `master` for Jack. This is read-only. Do not bypass original host checks.

2. **Both PCs — inspect the exact candidate.** Transfer only the public signed
   QL-365A candidate JSON through the approved private channel. Each owner puts
   a copy under their own private `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Enrollment\`
   folder. Run:

   ```powershell
   $candidate = 'EXACT_PATH_TO_SIGNED_QL365A_CANDIDATE.json'
   node .\runtimes\hub-relay\ql365b-original-review-cli.mjs --inspect $candidate
   ```

   Compare `candidateSha256` **independently** across the two machines, along
   with QL-365A's exact `originalPayloadSha256`, expiry, and the known Ree/Jack
   public SPKI pins. QL-365B validates both prior cryptographic signatures,
   original public bytes and the local role. On Ree it also checks the actual
   current original QL-344 receiver-OFF status. It does not claim an active STOP.

3. **Both PCs — explicitly attest only to review, before expiry.** The command
   independently decrypts each owner's existing local key using a hidden
   passphrase, requires a typed confirmation, and creates a **new** owner-specific
   immutable JSON file in the private Enrollment folder. Copy the exact
   `candidateSha256` printed by `--inspect`:

   ```powershell
   $base = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
   $digest = 'PASTE_EXACT_CANDIDATE_SHA256_FROM_LOCAL_INSPECT'
   $output = Join-Path $base ('Enrollment\ql365b-review-' + [guid]::NewGuid().ToString('N') + '.json')
   node .\runtimes\hub-relay\ql365b-original-review-cli.mjs --review `
     $candidate $digest $output
   ```

   Ree must type `REVIEW_QL365B_SOURCE_ONLY`; Jack must type
   `REVIEW_QL365B_MASTER_ONLY`. Both independently enter the passphrase **locally**.
   These receipts mean **key holder reviewed the same candidate only** — they
   are not physical host attestation or an authorization to proceed with TEST.

4. **Ree — reconcile without activation.** Transfer **only** Jack's signed
   QL-365B review JSON back to Ree; never his key or passphrase. On the original
   Ree machine:

   ```powershell
   $reeReview = 'EXACT_PATH_TO_REE_QL365B_REVIEW.json'
   $jackReview = 'EXACT_PATH_TO_JACK_QL365B_REVIEW.json'
   node .\runtimes\hub-relay\ql365b-original-review-cli.mjs --reconcile `
     $candidate $reeReview $jackReview
   ```

   Expected (only if both signed receipts are genuine and still valid):
   `ORIGINAL_OWNER_REVIEW_SIGNATURES_VALID_EXTERNAL_TRUST_STILL_HELD`.
   Ree's local OFF status is checked again. A mismatch, stale candidate, changed
   scope, forged signature or missing review is DENIED; no record is overwritten.

5. **STOP at independent trust decision.** The original field process has no
   approved, independently identified external policy reviewer or field witness
   on record. Until separate authorized custodians have been selected and their
   real keys/provenance pinned **outside the candidate and owner JSON**, there
   can be no genuine independent acceptance or supervised TEST authorization.

## Independent reviewer verifier contract (server-side integration)

`verifyQl365bIndependentDecisions()` accepts two *distinct* Ed25519-signed
review decisions, each binding the exact QL-365A signed candidate hash, both
QL-365B original-key review hashes, a single offline TEST preflight audience,
a ten-minute maximum lifetime and the original 20-minute QL-365A expiry.

It **only** trusts keys obtained through independently administered
`resolvePinnedReviewer(role)` and revocation/provenance checks from
`verifyIndependentCustody({role, spkiSha256, candidateSha256})`. Those functions
must be implemented by a separate trusted original-source service, **never**
by reading a PEM/pin, `approved` flag or custody claim from the submitted JSON.
Roles are `policy_reviewer` and `field_witness`; neither may use Ree's, Jack's,
the original device's, or the other external reviewer's signing key.

A valid externally witnessed decision yields
`SUPERVISED_OFFLINE_TEST_PREFLIGHT_REVIEW_ELIGIBLE_NO_ACTIVATION` **only**.
It still does not satisfy a QL-355 independent original issuer, original
database enrollment and signed receipt, authenticated private operator,
original transport or per-app TEST grant. No network action or operator
activation path is exposed by the QL-365B CLI.

## Verification and release

- `node --test runtimes/hub-relay/ql365b-original-reconciliation.test.mjs`:
  synthetic two-key review, verified external pins/custody, wrong role/key,
  tampered signature, stale replay, revoked pin, false activation and
  cross-request attacks; verifies every connected/authorization bit remains false.
- Original-device CLI on a **nonoriginal Windows CI runner** permits only
  `--status`/`--help`, never original owner review or reconciliation.
- Preserve QL-336A required release gates, QL-340–365A original-owner security
  checks and main-only public-asset parity. Software production GREEN is not
  six-app live integration GREEN.

Source: [QL-365A candidate](../../runtimes/hub-relay/ql365a-first-time-trust.mjs),
[QL-365B verifier](../../runtimes/hub-relay/ql365b-original-reconciliation.mjs),
[original owner CLI](../../runtimes/hub-relay/ql365b-original-review-cli.mjs),
[QL-355 existing legacy issuer/witness gate](../../runtimes/hub-relay/ql355-independent-authority.mjs).
