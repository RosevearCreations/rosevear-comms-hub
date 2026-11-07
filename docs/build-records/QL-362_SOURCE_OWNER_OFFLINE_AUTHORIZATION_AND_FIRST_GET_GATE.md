# QL-362 — Per-Source Owner Authorization Intake, Offline Candidate Signature Verification & First Approved Source-Only GET Safety Gate

## What Production GREEN can and cannot prove

QL-362 is software for an **owner-authorized, health-only, one-source TEST**.
Deploying it cannot create original issuer credentials, enroll Ree's original
Windows receiver, sign for Jack, grant a source a role, send a customer message,
or make a source connection `CONNECTED`. The last genuine original-host
observations and independent database readback still showed **zero original
device enrollments, zero signed TEST receipts, a `NOLOGIN` private receiver
and six exact peers `DISCONNECTED / HOLD`**. We do not fabricate a real TEST
just to satisfy a green software release.

## The original-owner steps

1. **Ree (`DESKTOP-AE894KC`) and Jack (`TEMPLAR`) each update a clean `main`
   repository clone** and run in PowerShell from the Comms Hub repository root:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql362-windows-source-owner-handoff.ps1 -Status
   ```

   This checks only local role and listener status; all approval fields remain
   `false`. On any other computer (including CI), the script is inert.

2. **Complete the genuine earlier chain first.** The original issuer and an
   independently authenticated witness must match preapproved public pins;
   Ree/Jack must have independently signed the same exact original QL-340B
   scoped TEST, an authenticated administrator enrolled one device, and the
   genuine QL-359 signed health-only receipt and supervised STOP exist. QL-360
   must have archived that original event. QL-361 must have independently
   audited the archive and written an owner-only six-source handoff. Do not
   transfer a private key, DPAPI file, raw DB credential or client token.

3. **Ree alone reads the original QL-361 handoff** for one chosen peer. Use
   the actual `handoffId` produced on her original machine, not the example:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql362-windows-source-owner-handoff.ps1 -CandidateReadback -HandoffId 'ql361-00000000-0000-0000-0000-000000000000.json' -SourceId 'yw'
   ```

   `-SourceId` must be exactly one of `yw`, `icamp`, `rosiedazzlers`,
   `devilndove`, `ai-data-platform`, `rosevear-ai-hub`. The file hash is a
   local reference only; it does not verify external trust or grant a GET.
   Jack cannot read Ree's protected archive directory.

4. **The private operator prepares a fresh offline request** using
   `createQl362OfflineGetRequest` and an *independently enrolled pinned source
   manifest and HTTPS origin*. It contains exactly one source ID and immutable
   commit SHA, signed manifest hash, private original handoff hash, random
   one-use operation UUID, `TEST`, method `GET`, exact shell-health path, no
   customer/device rights, and a 90-second expiry. A generated unsigned
   intent is **not** an owner grant.

5. **Two separate offline signed decisions are required:**

   - The matching source application owner signs the exact SHA-256 request
     digest with their previously pinned, independently authenticated
     `source_owner` Ed25519 signing key.
   - The independently pinned Rosevear master owner (Jack's master role)
     signs the *same digest* with a distinct `master_owner` key. The source,
     master and redaction auditor keys must all be different. Expired,
     revoked, self-selected or mismatched signatures are rejected.

   Each attestation has the `rosevear.hub.ql362.exact-source-owner-approval.v1`
   schema, exact role, source ID, one-request digest, audience
   `rosevear-comms-hub:source-only-health-get:TEST`, decision
   `APPROVE_EXACTLY_ONE_SOURCE_HEALTH_GET`, time-bound `issuedAt`/`expiresAt`,
   and a detached canonical Ed25519 signature. **A JSON `approved:true`
   field or file presence is never a signature.** The private server must
   resolve already-approved source/master public-key pins and independent
   custody/revocation records outside the request's trust domain.

6. **First approved private GET:** `createQl362FirstSourceGetGate` will run
   only on a trusted original Ree/private server adapter. It first requires
   the owner-only original handoff and archive hash readback, distinct valid
   auditor/source/master signatures, fresh operator authentication, receiver
   and Tailnet gateway OFF, exact restricted PostgreSQL receiver role, one
   enrolled original device, one immutable original TEST receipt, zero
   revocations and six unchanged held peers. The operation ID is spent even
   if any subsequent verification fails.

   A separately authenticated private append-only **unique operation claim**
   must be durably recorded before one single signed GET. The private source
   sender enforces pinned HTTPS origin, no redirects, the exact path
   `/api/integration/v1/shell/health`, 4096-byte maximum and no source writes.
   The response body must contain only a narrowly allowed TEST health schema
   with all customer/device permissions `false`. The independent source
   signer receipt and immutable witness readback must match the same exact
   request/response digest. Any failure quarantines the operation; **no
   automatic retry** and no persistent source entitlement.

7. **One signed GET is not a connection.** Even if a genuine original-host
   first GET succeeds, the chosen source and the other five stay
   `DISCONNECTED / HOLD`. An independently reviewed persistent connection,
   tenant boundary and separate owner decision will still be required.

## Exact six source candidates

| Shell | Source repository | Result until independently signed |
| --- | --- | --- |
| Rosie Dazzlers | `rosiedazzlers` | HOLD |
| Devil n Dove | `devilndove-site` | HOLD |
| iCamp | `iCamp` | HOLD |
| Yard Workers | `yw` | HOLD |
| AI Data Platform | `ai-data-platform` | HOLD |
| Rosevear AI Hub | `rosevear-ai-hub` | HOLD |

## Code, verification and deployment

- `runtimes/hub-relay/ql362-source-owner-first-get.mjs` builds deterministic
  offline GET proposals and verifies exact independently pinned, signed
  source/master decisions before one supervised operation. No HTTP endpoint
  is added; callers must supply **trusted private original-host adapters**.
- `runtimes/hub-relay/ql361-archived-chain-audit.mjs` exports a reusable
  strict archival redaction shape checker; QL-362 recomputes the full QL-361
  redaction-report hash against the original six-held-peers DB readback.
- `runtimes/hub-relay/ql362-windows-source-owner-handoff.ps1` offers only
  original Windows status and Ree owner-private candidate-file readback. It
  cannot sign, grant, activate, send network requests or write to a source.
- The required CI Windows tests include invalid/offline owner and auditor
  signatures, malformed source origin, original-host/DB mismatch, stale
  request, changed health response, replay, redirect, missing durable claim,
  failed independent witness and the successful **synthetic-only** one-GET
  safety scenario. Synthetic CI does not establish original trust.
- QL-336A's full historical release gates, Windows security jobs and public
  Worker asset parity remain mandatory for `dev`/`main` promotion.

## Next proposed build

**QL-363 — Six-Source Health GET Contract Compatibility, Source-Signed
Read-Only Receipt Adapters & Independent Private TEST Closure Verification.**
