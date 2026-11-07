# QL-356 — Original issuer-pin custody, original Ree/Jack field execution and first genuine TEST receipt

## Original field observations, 2026-11-06

These values come from the owners' actual `ql354-windows-owner-handoff.ps1 -Status` output, **not** from a CI fixture or a remotely authenticated session.

| Proof gate | Ree — original `DESKTOP-AE894KC` | Jack — separate `Templar` |
| --- | --- | --- |
| Local protected private owner signing key | Source present | Master present |
| Original owner's public candidate | Source present | Master present |
| Imported *public* master candidate on Ree | Present | Not applicable |
| Original LAN service on Ree | One listener | Not applicable |
| Private receiver / Tailnet transport | OFF / OFF | Not applicable |
| Signed enrollment and approved owner pins | **Absent** | No approved decision supplied |
| Independent original issuer / field witness authenticated | **No / No** | **No / No** |
| Original reviewed database enrollment | **Not verified** | **Not verified** |
| Original device-signed TEST receipt | **Not verified** | **Not verified** |
| Six application grants | **DISCONNECTED / HOLD** | **DISCONNECTED / HOLD** |

**Software production GREEN is not authorization for a live TEST.** A TLS `503` confirms the earlier transport-only deny-all gateway, not private application authentication. Neither QL-356 nor CI invents an original issuer or signer, signs for an owner, activates the receiver, provisions a database login, or reports a connected application.

## Step 1 — Both original Windows accounts: update safely and check custody

On **Ree's** Windows PC, use PowerShell as `Ree`:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -Status
```

On **Jack's** separate `Templar` laptop, use PowerShell as `jfros`:

```powershell
cd C:\Users\jfros\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -Status
```

The example checkout directories are based on the previous handoff; if Jack's directory differs, first `cd` into the checkout containing `runtimes\hub-relay`. **Stop** if `git status` shows local changes that could be overwritten. Do not reset, stash or delete those changes to force a pull. The command intentionally returns `HOLD` even when both machines and local candidates are detected.

## Step 2 — Independently authenticate *original* issuer-pin and field-witness custody

Before requesting an owner decision, the **independent original issuer** and a distinct **field witness** must each confirm their own public Ed25519 signing key's original custody through separate, authenticated channels. These roots must already be approved and stored **outside** the request, browser, GitHub repository, and any file sent by Ree/Jack. They must sign the **same current request payload SHA-256**, with the exact original device/source/master public candidates and four *original* field witness hashes.

Required original Ree witness files: Windows running-process/startup evidence, private TLS pair/chain evidence, approved Tailnet ACL showing Jack → Ree `tcp:8443` allowed while `tcp:8788` denied, and original rollback evidence. **Do not substitute generated placeholders, screenshots, a TLS certificate alone or a JSON `approved:true`.** Stop if original independent roots or original witnesses are missing. QL-355's private `verifyQl355Authority` and QL-356's `inspectQl356IndependentIssuerPins` accept only genuine independently resolved and checked Ed25519 authority, not declarations of trust.

## Step 3 — Ree prepares exactly one unsigned public TEST request

Coordinate a **20-minute live review window** with Jack and the independent reviewers first. Locate the four original witness files *on Ree's computer*. Create an owner-controlled JSON paths manifest **outside the repo** with exactly the four keys shown below; every value must be the real, existing local file path, not these examples:

```json
{
  "windows": "FULL_PATH_TO_ORIGINAL_WINDOWS_PROCESS_WITNESS",
  "privateTls": "FULL_PATH_TO_ORIGINAL_TLS_PAIR_CHAIN_WITNESS",
  "tailnetAcl": "FULL_PATH_TO_ORIGINAL_TAILNET_ACL_WITNESS",
  "rollback": "FULL_PATH_TO_ORIGINAL_ROLLBACK_WITNESS"
}
```

Use a **unique filename** for each attempt and an **already existing** `Enrollment` directory. In Ree's repo:

```powershell
$manifest = 'FULL_PATH_TO_REAL_FOUR_WITNESS_PATHS.json'
$request = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay\Enrollment\ql356-fresh-test-request.json'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -PrepareUnsigned -EvidencePathsFile $manifest -RequestPath $request
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -ReviewRequest -RequestPath $request -EvidencePathsFile $manifest
```

The explicit prompt is `PREPARE_QL356_UNSIGNED_TEST_ONLY`. It builds a **public-only, unsigned, short-lived** QL-340B request with a real SHA-256. It checks Ree's original host, local LAN listener, receiver and Tailnet gateway OFF, existing candidates and witness manifest, and **never overwrites** an earlier request. Inspect the printed SHA-256 and expiry. If already present, pick a new output filename; do not delete evidence. Never send the four witness files, private keys, passphrases or `.dpapi` secrets to Jack or chat.

## Step 4 — Jack independently reads the exact public request

Transfer **only the public unsigned request JSON** to Jack through the agreed owner channel. On Jack's laptop, if saved as shown:

```powershell
$request = Join-Path $env:USERPROFILE 'Downloads\ql356-fresh-test-request.json'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -ReviewRequest -RequestPath $request
```

Jack's local review checks his **own** stored master public Ed25519 candidate, the request's digest and the unexpired exact payload. It explicitly reports `REMOTE_ORIGINAL_WITNESS_BYTES_NOT_REVIEWED` because those sensitive original Ree files remain on Ree's machine. Compare the precise SHA-256 and expiry through a separate conversation. This **does not sign Jack's approval**.

## Step 5 — Only after genuine independent issuer/witness decisions

Stop here until both independent original authorities have verifiably signed the current digest, and Ree and Jack separately decide the exact scoped **TEST-only** request. The existing [QL-354 original-owner ceremony](QL-354_ORIGINAL_CUSTODY_SIGNED_ENROLLMENT_AND_FIRST_TEST_CHALLENGE.md) documents the local owner `--sign source`, `--sign master`, `--assemble`, and `-InspectSigned` steps. Those real key operations occur **only** on each owner's original Windows account and only while the 20-minute request is valid. The QL-356 public review commands do **not** invoke any of those approval operations.

Only a separately authenticated **private** administrator may evaluate append-only enrollment with genuine authenticated external attestations, genuine separate source/master signatures and unchanged original witnesses; `ql340c_private_receiver` is presently NOLOGIN, with no dedicated approved DPAPI credential. No user should create a substitute database credential, enable LOGIN, enable the receiver, or open `8788` based only on a public request.

## Step 6 — One genuine private receipt, then keep other six peers held

After independent enrollment and exact original-device signer custody have been verified, the existing QL-354/QL-355 private acceptance code requires a freshly signed 90-second one-device TEST challenge, authenticated private operator, approved transport and **one append-only PostgreSQL receipt** for that exact challenge. QL-356's `inspectQl356FirstFieldReceipt` delegates cryptographic and database acceptance to QL-355; a missing or fake receipt is **HOLD**. Preserve the original LAN Caddy, router/network ACL, and AI Hub recovery startup service throughout; stop only the exact supervised private receiver/gateway when authorized. This one TEST is **not** permission to exchange live customer, device or source-app data.

### Owner STOP checks

- Missing original independent issuer or distinct witness → `DISCONNECTED / HOLD`.
- Expired or altered 20-minute request, changed four original witness bytes, wrong Ree or Jack public pin → `DISCONNECTED / HOLD`.
- Either owner has not deliberately signed the exact scoped request → `DISCONNECTED / HOLD`.
- No approved original-device enrollment, restricted private credential, authenticated operator, signed original-device reply or immutable first receipt → `DISCONNECTED / HOLD`.
- Never use a CI fixture or green build check as evidence of original owner enrollment or real peer connectivity.

## Source and verification references

- [Read-only QL-356 original owner verifier](../../runtimes/hub-relay/ql356-original-field-readback.mjs)
- [Original-account Windows field handoff](../../runtimes/hub-relay/ql356-windows-field-handoff.ps1)
- [QL-355 original external authority verifier](../../runtimes/hub-relay/ql355-independent-authority.mjs)
- [QL-340B original cryptographic owner ceremony](../../runtimes/hub-relay/ql340b-ceremony.mjs)
- [Original receiver database security schema](../../supabase/migrations/20261105183936_ql339b_private_device_enrollment_and_revocation.sql)
- [QL-356 safety tests](../../runtimes/hub-relay/ql356-original-field-readback.test.mjs)
