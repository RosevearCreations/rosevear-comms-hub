# QL-358 — Original authority field verification, dedicated credential and first live TEST

## Verified production starting point (November 6, 2026 Eastern)

Ree's QL-357 readback came from **original `DESKTOP-AE894KC` signed in as `Ree`**. Jack's separate readback came from **`TEMPLAR` signed in as `jfros`**. Both local owner candidate public keys and protected encrypted signing keys exist. Ree has one original LAN listener; the separate Tailnet gateway and loopback receiver are OFF. On Ree, the signed enrollment and approved owner pins are absent, and the current-user receiver DPAPI credential is absent.

Read-only live Supabase project `gxujcwpktaickcgzyvnu` separately reports:

| Gate | Actual observation |
| --- | --- |
| Reviewed original device enrollment | **0** |
| Genuine immutable private TEST receipts | **0** |
| Dedicated `ql340c_private_receiver` PostgreSQL role | **NOLOGIN** |
| Six application peer records | **HOLD**, no source TEST or customer-data grant |
| Independently authenticated original issuer / distinct witness | **No field proof supplied** |

Therefore **shipping the QL-358 code GREEN is distinct from a genuine private TEST**. No database write, role LOGIN grant, real source/master signature, private URL, Caddy start, Tailnet change, customer communication or device action is authorized by these readbacks.

## 1 — Update the original computers and inspect, with no service changes

**Ree**, on the original server in PowerShell as `Ree`:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -Status
```

**Jack**, on independent `Templar` in PowerShell as `jfros`:

```powershell
cd C:\Users\jfros\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -Status
```

If either local checkout has edits or a divergent branch, **STOP**; do not use `git reset`, forced checkout or a destructive clean. On both computers `-Status` reports observed file existence only. It never decides issuer custody or connects a service.

## 2 — Identify the missing independent issuer and physical field witness

**This is the current first blocker.** An original issuer custodian and a separate independent field witness must already possess **two different, previously approved** Ed25519 public fingerprints outside the repository/request/browser. Each independently authenticates the key's original provenance, current custody and revocation status, then signs the **same current one-device TEST request SHA-256**. Ree and Jack must not sign on behalf of either independent authority. Neither a valid TLS certificate, Tailscale membership, copied public candidate, screenshot, browser approval toggle nor a new self-signed key constitutes that external trust anchor.

Ree also needs the **four genuine original files**, not placeholders: Windows process/startup witness, private TLS certificate/chain witness, Tailnet ACL (`Jack → Ree tcp:8443` allowed and direct `tcp:8788` denied), and original rollback witness. Their exact file paths go in an ACL-protected local JSON manifest with keys `windows`, `privateTls`, `tailnetAcl` and `rollback`, as in [QL-356's original field guide](QL-356_ORIGINAL_ISSUER_PIN_CUSTODY_FIELD_EXECUTION.md#step-3--ree-prepares-exactly-one-unsigned-public-test-request). Keep the original files and passwords on Ree's PC. **STOP until we have independent issuer/witness custody verified.**

## 3 — Compare one fresh unsigned 20-minute request on both computers

Coordinate a short review window with Jack and the independent custodians. Ree creates the **unsigned** request with the existing QL-356 `-PrepareUnsigned`; the original folder must exist and each output filename must be new:

```powershell
$manifest = 'FULL_PATH_TO_CURRENT_FOUR_ORIGINAL_WITNESS_PATHS.json'
$request = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay\Enrollment\ql358-new-unsigned-test-request.json'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql356-windows-field-handoff.ps1 -PrepareUnsigned -EvidencePathsFile $manifest -RequestPath $request
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -ReviewRequest -RequestPath $request -EvidencePathsFile $manifest
```

Transfer **only the public unsigned request JSON** to Jack. Jack independently compares his original local master public key, the *same* exact SHA-256, and the expiry; he must not import Ree's four private witness files:

```powershell
$request = Join-Path $env:USERPROFILE 'Downloads\ql358-new-unsigned-test-request.json'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -ReviewRequest -RequestPath $request
```

Do not send signing passphrases, `.pem`, `.dpapi`, or privileged database connection strings. A request that expires during review is discarded: create another **fresh** one with a **new name**, never edit timestamps or overwrite the original.

## 4 — Only after independent issuer/witness proof: distinct owner decisions

Use the existing [QL-354 source/master signing ceremony](QL-354_ORIGINAL_CUSTODY_SIGNED_ENROLLMENT_AND_FIRST_TEST_CHALLENGE.md#4-ree-signs-source-jack-independently-signs-master). Ree signs `source` only from `DESKTOP-AE894KC`. Jack separately signs `master` only from `TEMPLAR`. Both deliberately approve the **same** SHA-256 and one `TEST` scope, with hidden local passphrase prompts. Transfer **Jack's public signed approval JSON** back to Ree, never his private key. Ree runs the existing protected `--assemble` operation. It writes the original `ql340b-signed-test-enrollment.json` and `ql340b-private-owner-public-pins.json` only if all pins and signatures verify.

Ree then performs original signed file review without contacting the DB:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -ReviewSigned -SignedRequestPath $request -SignedEvidencePathsFile $manifest
```

A valid owner signature readback is **not** independent original issuer approval or a database enrollment by itself.

## 5 — Separate original private administrator enrollment and dedicated credential

The original administrator must authenticate issuer and witness fingerprints through **independent, trusted custody services**, verify both owners and original evidence bytes, and execute QL-357's **single-use append-only** original enrollment transaction. QL-358's new server-only `inspectQl358OriginalFieldAndEnrollment` refuses a wrong administrator role, wrong/absent exact database row, revocation, existing receipt or six-peer drift. It issues only an in-process, expiring field ticket, never a database URL or public permit.

Only after legitimate enrollment and separate administrator authorization, the administrator may provision and enable a **dedicated, restricted** `ql340c_private_receiver` PostgreSQL login. Keep its password out of GitHub, chat, UI and process arguments. Ree may then use the pre-existing `ql340c-windows-operator.ps1 -StoreCredential` **hidden local prompt** to encrypt the approved URL with **Ree's Windows current-user DPAPI**, once, without sharing or exporting it. QL-358 does not automate the administrator role grant or DPAPI secret entry.

Ree can check the current credential handoff prerequisites, with no write:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -CredentialHandoff
```

Once **all** original approvals, DB record and restricted credential actually exist, Ree can run the limited-role readback while private receiver `8788` is OFF:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -ReceiverReadback
```

The server-only `verifyQl358DedicatedReceiverSession` requires the previous one-use field ticket and a real Ree-current-user DPAPI-authenticated connection as precisely `ql340c_private_receiver`. It rechecks the exact enrolled payload, zero receipts, and six peers held. A JSON `credentialPresent:true`, fake callback acknowledgement or `postgres`/service-role connection cannot satisfy it. Original Windows admin privileges or a browser session do not confer credential approval.

## 6 — First genuine cross-device TEST and immutable receipt

Only after all four earlier gates succeed, Ree separately supervises **one** original loopback-only receiver and Tailnet transport, per [QL-357's TEST guide](QL-357_ORIGINAL_OWNER_ENROLLMENT_PRIVATE_RECEIVER_AND_FIRST_CROSS_DEVICE_TEST.md). The original AI Hub's **device** key signs one fresh 90-second `health.read`/`capabilities.read` challenge. Jack's laptop accesses only approved private `tcp:8443`; direct `8788` remains denied. The receiver must be stopped precisely after the approved TEST; **never stop Ree's LAN Caddy or AI Hub recovery task**.

After the original device packet and independent owner review exist on Ree's private filesystem:

```powershell
$packet = 'FULL_PATH_TO_GENUINE_ORIGINAL_DEVICE_SIGNED_TEST_PACKET.json'
$review = 'FULL_PATH_TO_GENUINE_OWNER_TEST_REVIEW.json'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql358-windows-original-field.ps1 -VerifyReceipt -OriginalPacketPath $packet -OwnerReviewPath $review
```

The new server-only `reconcileQl358FirstLiveTest` consumes the one-use receiver ticket and independently requires a genuine Ed25519 device signature, authenticated operator and TLS/Tailnet transport and **exactly one matching immutable PostgreSQL receipt**. A successful one-device TEST still leaves all six applications `DISCONNECTED / HOLD` pending their *separate* shell-level consent and signer requirements.

## STOP conditions and source references

- **Now:** no independent original issuer/witness, no signed owner enrollment, no dedicated DPAPI receiver credential, zero live DB enrollment and zero TEST receipts. **STOP / HOLD**; cannot claim an active connection.
- Any unverified original byte, expired request, reused ticket, wrong database role, missing independent review, extra receipt, changed peer grant, or nonoriginal Windows account: **STOP**.
- `HTTP=503` and `TcpTestSucceeded=True` are transport observations, **not** authenticated application TEST proof.
- [QL-358 original cryptographic/DB readiness/receipt gate](../../runtimes/hub-relay/ql358-field-credential-reconciliation.mjs)
- [QL-358 Windows owner evidence wrapper](../../runtimes/hub-relay/ql358-windows-original-field.ps1)
- [QL-358 invariant tests](../../runtimes/hub-relay/ql358-field-credential-reconciliation.test.mjs)
- [Supabase PostgreSQL role/security documentation](https://supabase.com/docs/guides/database/postgres/roles)
