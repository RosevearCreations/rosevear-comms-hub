# QL-357 — Original-owner enrollment, authenticated private receiver and first cross-device TEST

## Actual production starting point

Read-only RosevearCreations Supabase project `gxujcwpktaickcgzyvnu` was checked on **2026-11-06 Eastern**:

| Original gate | Observed |
| --- | --- |
| Original approved device enrollment | `0` rows |
| Original durable relay TEST receipts | `0` rows |
| `ql340c_private_receiver` login enabled | `false` (`NOLOGIN`) |
| Six source peer records correctly held | `6` |
| Ree's original Windows PC | `DESKTOP-AE894KC`, source encrypted key and candidate present |
| Jack's independent Windows laptop | `Templar` (`jfros`), master encrypted key and candidate present |
| Independently authenticated original issuer/witness | **Not observed** |

**This build can ship software GREEN while the first genuine TEST stays `DISCONNECTED / HOLD`.** Source control and CI cannot authenticate the original Windows signing keys or complete a real physical owner's decision. Do not treat a synthetic test, copied issuer public key, TLS `503`, database screenshot or public JSON `approved` flag as independent authority.

## 1. Update both original computers; keep current services untouched

### Ree — original Rosevear AI Hub PC

Open PowerShell as `Ree`:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql357-windows-owner-activation.ps1 -Status
```

### Jack — independent `Templar` laptop

Open PowerShell as `jfros` in Jack's existing Comms Hub checkout (if the path differs, `cd` into the repo containing `runtimes\hub-relay`):

```powershell
cd C:\Users\jfros\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql357-windows-owner-activation.ps1 -Status
```

**STOP before pulling if `git status` shows local edits.** Preserve originals; no `reset --hard`, forced checkout, deletion or unrelated process restart. The original LAN Caddy service remains untouched, the separate Tailnet gateway/receiver remains OFF. QL-357 `-Status` is intentionally read-only, reports local file *presence*, and cannot invent issuer, DB or TEST proof.

## 2. Collect the missing original independent proof

This is the current *blocking* step. Ree must identify and independently verify the four **original** process/startup, private TLS certificate/chain, Tailnet ACL and rollback witness files. Jack must review the exact scope, request digest and his own local master public candidate, without receiving Ree's private files. Independently authenticated original issuer and distinct field witness need previously approved Ed25519 public pins, their own private keys and **separate original custody/revocation checks**; each signs the exact one-device `TEST` request SHA-256. Neither Ree nor Jack can impersonate either independent custodian.

Use the existing [QL-356 field guide](QL-356_ORIGINAL_ISSUER_PIN_CUSTODY_FIELD_EXECUTION.md) to create one **unsigned public** 20-minute QL-340B request and compare the same SHA-256 and expiry on both computers. If any original file, reviewer, identity, signature or expiry is missing, **STOP on HOLD**. Do not export private `.pem`/passphrase, Windows DPAPI encrypted credential, or database administrator password.

## 3. Ree and Jack sign their own scoped TEST decisions, only after step 2

The exact local `ql340b-ceremony.mjs --sign source` (Ree) and `--sign master` (Jack), signed `--assemble` command, and existing protected output filenames are in [QL-354's original-owner walkthrough](QL-354_ORIGINAL_CUSTODY_SIGNED_ENROLLMENT_AND_FIRST_TEST_CHALLENGE.md#4-ree-signs-source-jack-independently-signs-master).

No assistant, CI, browser, GitHub action or database job should supply those signatures. Ree then verifies the original private signed intake with QL-357's safe wrapper:

```powershell
$request = 'FULL_PATH_TO_THE_FRESH_ORIGINAL_UNSIGNED_REQUEST_JSON'
$manifest = 'FULL_PATH_TO_REES_REAL_FOUR_WITNESS_PATHS_JSON'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql357-windows-owner-activation.ps1 -ReviewSigned -RequestPath $request -EvidencePathsFile $manifest
```

The readback verifies genuine source/master signatures and *exact original files*; it does **not** by itself authenticate the issuer/witness or insert a database enrollment. Do not continue on a held result.

## 4. Supervised private database enrollment — original admin only

The QL-357 server-only `executeQl357SupervisedEnrollment` calls the existing QL-355 independently pinned issuer/witness verifier and QL-354's single-use `insertQl354OriginalEnrollmentOnce`. It requires genuine external custody-verifier functions, the actual signed Ree/Jack intake, original witness bytes and an **independently authenticated original private administrator transaction**. It inserts at most one immutable `REVIEWED_TEST` device enrollment after checking the six HELD peers, zero prior enrollment, zero revocation, zero receipts and exact DB administrator role. A transaction failure consumes the permit; no automatic retries.

These callbacks cannot be supplied or authorized by the public frontend. The private administrator must review and execute the genuine original ceremony from an approved, independently controlled environment. No such real external authority or original owner signatures have been provided to QL-357; the production enrollment must remain empty. **Do not manually insert a fabricated enrollment row, enable a browser/service-role key, change RLS or grant `LOGIN` to make a test pass.**

## 5. Authentic private receiver credential and one TEST only

Only **after** successful original enrollment and separate permission to provision the constrained `ql340c_private_receiver` role, an original administrator may provide a **dedicated, least-privilege** PostgreSQL URL through a secure owner-controlled channel. The existing [QL-340C Windows operator](../../runtimes/hub-relay/ql340c-windows-operator.ps1) can store that approved URL using Ree's Windows current-user DPAPI **locally** with `-StoreCredential`; never put the URL into chat, GitHub or a public environment variable.

From Ree's PowerShell, with receiver `8788` **OFF** and actual signed enrollment and approved local pins present:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql357-windows-owner-activation.ps1 -PrivateReadback
```

This only invokes the existing limited-role database readback and writes an ACL-restricted local evidence snapshot. The new `inspectQl357PrivateReceiverReadiness` separately checks a live limited-role DB identity, the exact original signed row, zero revocations/old receipts, six HELD peers, external issuer/witness signatures and independently verified private operator/transport. It returns ready **for one supervised TEST** only when all are genuine. Nothing is started automatically by this script. A client can never manufacture a private operator session.

Only following these gates may Ree **separately supervise** the existing explicit `ql340c-windows-operator.ps1 -Start` and previously validated QL-352 Tailnet gateway procedure. Preserve Jack → Ree Tailnet `tcp:8443` allowed, direct `tcp:8788` denied. Use the original AI Hub **device key** (not Ree or Jack owner keys) to sign one fresh 90-second `health.read`/`capabilities.read` envelope, transmit only the reviewed TEST, stop the exact supervised receiver, then reconcile its single PostgreSQL receipt. This should be scheduled within the short-lived approval window; otherwise start from a fresh request.

## 6. Ree verifies the genuinely signed receipt, keeping six apps HELD

Only when one original signed packet and separate owner-review file have been created from the real original device and stored in Ree-controlled private locations:

```powershell
$packet = 'FULL_PATH_TO_REAL_ORIGINAL_DEVICE_SIGNED_TEST_PACKET.json'
$review = 'FULL_PATH_TO_REAL_INDEPENDENT_OWNER_TEST_REVIEW.json'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql357-windows-owner-activation.ps1 -VerifyReceipt -OriginalPacketPath $packet -OwnerReviewPath $review
```

This delegates to existing QL-340C strict readback. The new `acceptQl357OneCrossDeviceTest` independently requires the original device Ed25519 signature, authenticated private operator, authenticated Tailnet transport and **exactly one matching immutable PostgreSQL receipt**. It never marks a source app connected or permits a customer message, device action or repository write. A valid first device TEST is a narrow proof, not a six-app application handshake.

## STOP / rollback rules

- No genuine independent issuer, witness or owner signature: **HOLD**. Only public candidate files are currently known to exist.
- No reviewed original admin enrollment or dedicated receiver credential: **HOLD**. `NOLOGIN` must not be bypassed.
- A `503` is the earlier deny-all transport behavior, not an authenticated TEST receipt.
- Receiver or gateway process is already running unexpectedly, one original witness changed, request expired, more than one receipt or any source peer becomes connected: **STOP and investigate**. Never stop the original LAN Caddy or AI Hub scheduled recovery task.
- The original owner chooses when to stop the exact supervised TEST listener; preserve one immutable field receipt for independent review.

## Verifiable source and runtime references

- [QL-357 original private enrollment/readiness/receipt functions](../../runtimes/hub-relay/ql357-original-activation.mjs)
- [QL-357 Windows original-owner procedure](../../runtimes/hub-relay/ql357-windows-owner-activation.ps1)
- [QL-357 cryptographic and fail-closed tests](../../runtimes/hub-relay/ql357-original-activation.test.mjs)
- [Original signed owner record and append-only insertion gate](../../runtimes/hub-relay/ql354-original-owner-intake.mjs)
- [Supabase roles and custom login permissions](https://supabase.com/docs/guides/database/postgres/roles)
