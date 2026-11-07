# QL-365A — First-time original-owner trust bootstrap (TEST, OFFLINE)

## Why this is a separate procedure

Ree and Jack confirmed they have **separate, existing encrypted owner-key candidates**, but
there is **no previously approved independent original issuer or field-witness signer**.
QL-355's existing external issuer/witness requirements remain unmet. QL-365A creates a
**new, explicitly first-time, owner-controlled alternative candidate review**. Nothing
in QL-365A makes the QL-355 checks true or grants live authorization.

Original operator-provided public candidates (not themselves proof of person identity):

| Custodian | Original Windows host | Role / keyId | Original SPKI SHA-256 |
| --- | --- | --- | --- |
| Ree | `DESKTOP-AE894KC` (`Ree`) | `source-owner-ql340a` | `e3be0648e3c9c7737c2857a8d36d31ea5c74a69211a55ac201347ce220d3158e` |
| Jack | `TEMPLAR` (`jfros`) | `comms-master-jack-ql340a` | `3b086d0f89e51311b458eb94aa585f7b7a797a86c8061c8cd0b4b4d0b75585d5` |

Ree's original public candidate JSON SHA-256 is
`E37042D382BE26BEDDA70F72FA7934018BCA0513FD1B106243618D450EAA2E43`;
Jack's is `F5B0F8CB970CA6504BE63F75898C21491A4F83FEAC8B7C5C5E408E4B729E0F8F`.
The implementation checks the actual Ed25519 public keys and these exact original-file bytes
on each signing machine, not a copied filename or screenshot.

**Safety:** The QL-342A inert rollback drill was **not a stop of the real receiver**.
QL-344 `INITIAL_RECEIVER_OFF` is an observation of the receiver already OFF, not a
witnessed shutdown. The original Comms service stays `DISCONNECTED / HOLD`; receiver
port `8788` stays OFF, the Tailnet Serve gateway OFF and limited PostgreSQL receiver
role **NOLOGIN**. No six-app connection, data exchange, message, device action, database
insert, live key enrollment or network call is performed by these commands.

## Original-device walkthrough — coordinate before starting 20-minute window

Use `node` v22+ and PowerShell on the two **original**, separately controlled devices.
Do not paste private keys, passphrases, or database credentials into ChatGPT or GitHub.
If hostnames or user accounts differ, **STOP** rather than editing the checks.

### 1 — Both computers: update safely and check read-only status

On Ree's PC open PowerShell in `C:\Users\ree\rosevear-comms-hub-current`.
On Jack's PC use `C:\Users\jfros\comms-current`. On each:

```powershell
git status -sb
git fetch origin
git pull --ff-only origin main
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --status
```

If the worktree has local changes, **do not** force a pull or discard them. The
read-only status must show `originalOwnerRole: source` for Ree or `master` for Jack
and all activation/enrollment flags false. If `null`, stop and resolve the original
machine identity. `--status` is also safe on a nonoriginal CI runner but can never
authorize anything.

### 2 — Ree checks four genuine evidence files and fresh receiver-OFF observation

Before continuing, both people independently read/review the four **actual** files:

1. `Evidence\windows-process-readback.json` — current Windows process/startup record.
2. `Evidence\private-tls-chain.json` — original private HTTPS chain record.
3. `Evidence\tailnet-grants-readback.hujson` — Tailnet access-control record.
4. The single `Evidence\ql342a-inert-rollback-drill-*.json` — inert drill **only**.

Confirm the TLS evidence and Tailscale access rules are genuinely the intended original
sources. A recorded hash alone never authenticates an issuer or witness. Keep the original
files unchanged. The QL-343 evidence-paths JSON needs **exactly** the four keys
`windows`, `privateTls`, `tailnetAcl` and `rollback` pointing to these files.

Ree then checks that receiver port 8788 and Tailnet Serve remain OFF, without changing them:

```powershell
$base = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File `
  .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Status
```

This must report `RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP`. If it does not,
**STOP**. Do not configure Tailnet, expose receiver port 8788 or turn on the receiver.

### 3 — When both owners are available: capture fresh OFF evidence and prepare request

This is the **only** time to start the 20-minute clock. Both owners should already
have time to review and decide separately. On **Ree's original PC**:

```powershell
$off = powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File `
  .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Capture | ConvertFrom-Json
$off.observationPath
$manifest = (Get-ChildItem -LiteralPath (Join-Path $base 'Evidence') `
  -Filter 'ql343-original-evidence-paths-*.json' -File | `
  Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
$request = Join-Path $base ('Enrollment\ql365a-request-' + [guid]::NewGuid().ToString('N') + '.json')
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --prepare `
  $manifest $off.observationPath $request
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --inspect $request
```

Ree must type the exact preparation confirmation when prompted. The QL-344 capture
itself requires its own specific confirmation. If the new observation is older than
five minutes at request creation, prepare fails; capture a new OFF observation only
after reviewing the actual environment again. The request expires **20 minutes**
after creation. The original source/public bytes and imported Jack public candidate
must match the previously reported key pins.

### 4 — Ree and Jack independently review and sign the **same digest**

Ree reads `payloadSha256` from `--inspect`. Transfer **only the public unsigned request**
to Jack via your approved private channel; Jack places a copy under his own private
`%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Enrollment\` folder. Ensure both see the
same 64-character digest and expiry; verify independently, never accept a pasted claim.

On **Ree's** PC:

```powershell
$digest = 'PASTE_EXACT_64_CHARACTER_PAYLOAD_SHA256_FROM_INSPECT'
$reeApproval = Join-Path $base ('Enrollment\ql365a-ree-approval-' + [guid]::NewGuid().ToString('N') + '.json')
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --sign `
  $request $digest $reeApproval
```

On **Jack's** PC, from his own Comms repository:

```powershell
$base = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay'
$request = 'EXACT_LOCAL_PATH_TO_COPIED_PUBLIC_QL365A_REQUEST.json'
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --inspect $request
$digest = 'PASTE_SAME_VERIFIED_64_CHARACTER_PAYLOAD_SHA256'
$jackApproval = Join-Path $base ('Enrollment\ql365a-jack-approval-' + [guid]::NewGuid().ToString('N') + '.json')
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --sign `
  $request $digest $jackApproval
```

Each signer must explicitly type `SIGN_QL365A_FIRST_TRUST_SOURCE` or
`SIGN_QL365A_FIRST_TRUST_MASTER`, and enter the **original private-key passphrase**
hidden on their own machine. These commands **cannot** run automatically in CI or on
the other host. A signature proves possession of that specific encrypted private key,
**not** independent original issuer/witness identity. Transfer back **only Jack's signed
approval JSON**; no private `.pem`, DPAPI secret, passphrase or database URL.

### 5 — Ree assembles an offline candidate while the request remains valid

Ree saves Jack's received approval into her private Enrollment folder and runs:

```powershell
$jackApproval = 'EXACT_LOCAL_PATH_TO_IMPORTED_JACK_SIGNED_APPROVAL.json'
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --assemble `
  $request $reeApproval $jackApproval
$signed = Join-Path $base 'Enrollment\ql365a-signed-first-trust-candidate.json'
node .\runtimes\hub-relay\ql365a-first-time-trust-cli.mjs --inspect-signed $signed
```

Expected: `TWO_ORIGINAL_OWNER_SIGNATURES_VERIFIED_FIRST_TRUST_CANDIDATE_ONLY`.
All `databaseEnrollmentAuthorized`, `receiverActivated`, `sixAppGrantsAuthorized`,
`customerCommunications`, `deviceActions` and `connected` flags remain false.
The signed candidate file refuses overwrite; do not delete an existing candidate to
retry or artificially renew an expired approval. Preserve evidence and request hashes.

### 6 — STOP: next policy and real activation are separate

This is a verified **first-time dual-original-owner proposal**, **not** a connected app.
A distinct independent administrator/custodian acceptance policy, reviewed least-privilege
database enrollment, genuine original signed TEST receipt and explicit per-source grants
are still required. Do **not** invoke legacy QL-340B/QL-354/QL-355 live enrollment or
QL-357 receiver activation with a QL-365A candidate. It is deliberately a different
schema and signature domain; legacy verifiers must reject it.

## Development and release acceptance

- `node --test runtimes/hub-relay/ql365a-first-time-trust.test.mjs` exercises synthetic
  (not the owners' actual private) Ed25519 keys: two-signature success, wrong signer,
  replay/tamper, expiry, witness-byte changes, false active-stop claims and policy flags.
- The real CLI **never** accepts test-only pin overrides. Its original owner pins
  are built into the code from the public key hashes Ree and Jack provided.
- A nonoriginal Windows CI machine can run only `--status` and cannot sign.
- Existing protected CI security and release checks are unchanged.
- `main = GREEN` means the source build deployed successfully; it does **not** certify
  independent human identity, owner signatures on original machines, a real private
  receiver startup or connected peer applications.

### Source references

- [QL-365A cryptographic verifier](../../runtimes/hub-relay/ql365a-first-time-trust.mjs)
- [QL-365A original-Windows owner CLI](../../runtimes/hub-relay/ql365a-first-time-trust-cli.mjs)
- [QL-344 original receiver-OFF observer](../../runtimes/hub-relay/ql344-windows-off-observer.ps1)
- [QL-340B existing original owner key custody](../../runtimes/hub-relay/owner-authority-custody.mjs)
- [QL-355 external issuer/witness policy (unchanged)](../../runtimes/hub-relay/ql355-independent-authority.mjs)
