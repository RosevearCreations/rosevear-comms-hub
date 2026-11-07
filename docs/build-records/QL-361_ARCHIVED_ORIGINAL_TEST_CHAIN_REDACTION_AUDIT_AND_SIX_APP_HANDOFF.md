# QL-361 — Archived Original TEST Chain Verification, Independent Redaction Audit & Owner-Controlled Six-App Connection Candidate Handoff

## Evidence-based boundary

Releasing QL-361 software to `dev` and `main` does **not** create a genuine
original-host trust receipt or authorize a source connection. The last
observed original Ree (`DESKTOP-AE894KC`) / Jack (`TEMPLAR`) outputs reported
`originalIssuerIndependentlyAuthenticated=false`,
`ownersIndependentlyApproved=false`, `databaseEnrollmentVerified=false`, no
Ree-only private DPAPI credential, and no original private receiver listener.
The last independent database readback reported **zero approved original
enrollments**, **zero signed immutable TEST receipts**, the private receiver
login disabled and **six peers `DISCONNECTED / HOLD`**. These field statements
must not be marked verified solely because a release or CI fixture is green.

## Owner procedures (read-only until real independently signed trust exists)

1. **On Ree's original Windows server and Jack's independent laptop**, pull
   the signed-release `main` version into each clean local clone. In PowerShell
   at the Comms Hub repository root, run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql361-windows-owner-audit.ps1 -Status
   ```

   On unrecognized Windows CI or another machine, only the inert HOLD status
   works. Jack cannot inspect the original private archive folder. This step
   does **not** authenticate a key, install credentials, enable a receiver or
   create a TEST receipt.

2. **Genuine previous-test prerequisites:** before any archive verification,
   independently authenticate the original issuer and separate field witness
   against preapproved external Ed25519 public-key pins and revocation
   custody. Ree and Jack separately review and sign the same fresh scoped
   QL-340B TEST request. An authenticated original administrator must enroll
   that exact original device and provision only the approved limited private
   receiver login. Perform a genuine QL-359 original-device signed, health-only
   private TEST with exactly one immutable database receipt; then supervise
   the actual QL-340C receiver STOP and independent QL-359 closeout witness.
   **None may be replaced with fixture keys, a browser toggle or file existence.**

3. **After QL-360 archives that genuine TEST:** the original Ree server must
   have verified the actual receiver STOP, exactly one immutable receipt, zero
   revocations and six held peers, then stored an allowlisted QL-360 archive
   with atomic create-new, original-user-only Windows ACL, SHA-256 and
   independent same-byte readback. While logged into original Ree Windows,
   use the returned `archiveId` (not a path copied from another host):

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\runtimes\hub-relay\ql361-windows-owner-audit.ps1 -ArchiveDigest -ArchiveId 'ql360-00000000-0000-0000-0000-000000000000.json'
   ```

   Replace the illustrative ID with **the exact real QL-360 archiveId**. The
   command reports a file checksum and the claimed canonical evidence hash,
   for private external review. The two hashes deliberately measure different
   things: a file's bytes and the canonical evidence JSON. **Neither a matching
   hash nor this PowerShell command independently authenticates original
   issuer custody, signed TEST or owner approval.**

4. **Independent auditor:** the trusted server-only QL-361 verifier consumes
   the real nonserializable QL-360 success object *once* within 10 minutes of
   archiving; failure consumes that proof too. It re-reads the same QL-360
   owner-private archive, validates its SHA-256 and exhaustive field allowlist,
   rechecks the restricted PostgreSQL receiver role, same one approved device,
   one immutable TEST receipt, zero revocations and six exact held peers, and
   observes the original receiver and Tailnet gateway still OFF within 30
   seconds. The independent redaction auditor receives the exact deterministic
   report from `buildQl361RedactionReport`, cryptographically reviews the
   allowed fields and signs the SHA-256 digest with their *previously approved*
   distinct Ed25519 key. The server verifies its SPKI digest, independent
   custody/revocation and a 10-minute maximum signature validity. The auditor
   must **not** be the original QL-359 field-witness key. An arbitrary public
   key supplied inside an untrusted request cannot be treated as pinned.

5. **Owner-controlled candidate handoff:** after every verification succeeds,
   the server writes and hashes exactly **six offline source-review
   candidates** in Ree's original current-user-only private `Ql361Handoff`
   directory using atomic create-new, then independently reads back and hashes
   the same bytes. The audit signature is included for verification. Each
   candidate is restricted to a proposed *health read-only TEST*, has
   `sourceTestAuthorized=false`, `customerDataAllowed=false`, and requires a
   fresh independent signed authorization from the matching source owner.
   **No candidate connects an app, starts a receiver, grants a database role,
   sends customer messages, touches a device or writes any source repository.**

## Six exact shell-level candidates

| Source shell | Repository | State after QL-361 |
| --- | --- | --- |
| Rosie Dazzlers | `rosiedazzlers` | Pending independent source-owner signed TEST |
| Devil n Dove | `devilndove-site` | Pending independent source-owner signed TEST |
| iCamp | `iCamp` | Pending independent source-owner signed TEST |
| Yard Workers | `yw` | Pending independent source-owner signed TEST |
| AI Data Platform | `ai-data-platform` | Pending independent source-owner signed TEST |
| Rosevear AI Hub | `rosevear-ai-hub` | Pending independent source-owner signed TEST |

`connectionState` stays `DISCONNECTED / HOLD` for all six. Production release
GREEN and original owner/private TEST status are **separate**.

## Code and verification

- `runtimes/hub-relay/ql360-original-evidence-archive.mjs` now exports a
  process-only, consumed-on-first-attempt verified archive capability. A
  successful JSON response copied off the host is not a capability.
- `runtimes/hub-relay/ql361-archived-chain-audit.mjs` independently verifies
  the real archived chain, hashes an exact redaction allowlist, checks a
  separately pinned Ed25519 signature, verifies original STOP and DB state,
  then creates six unapproved candidate records. All failures stay HOLD.
- `runtimes/hub-relay/ql361-windows-private-handoff.mjs` restricts private
  candidate storage to Ree on the original Windows host and uses `icacls`
  through existing current-user ACL helper, `wx` and digest readback.
- `runtimes/hub-relay/ql361-windows-owner-audit.ps1` allows read-only local
  status and original archive file checksums only, not trust creation.
- The `app-ci.yml` Windows release gate tests all new guards and the inert
  field script. The QL-336A full historical suite, app build, public asset
  parity and protected promotion policies remain intact.

## Next proposed build

**QL-362 — Per-Source Owner Authorization Intake, Offline Candidate Signature
Verification & First Approved Source-Only GET Safety Gate.**
