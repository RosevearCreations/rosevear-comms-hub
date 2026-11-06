# QL-344 — Independent Receiver-OFF Attestation, Original-Issuer Evidence Reconciliation & Dual-Owner Signing Readiness

## Scope and operational state

The receiver **remains OFF**. No live six-app connection, production database
enrollment, private credential handoff, owner signature, TEST heartbeat, customer
communication or home-device action is authorized by this build.

QL-342A stopped an **inert local test child**. It did **not** stop the real
receiver. QL-344 now supports owner-supervised *observation that the real
receiver is not listening on TCP 8788 and Tailscale Serve is not configured*.
This observation cannot establish that a previously active receiver was stopped,
nor can it independently prove the issuer of earlier Windows, TLS or Tailnet
evidence. Those claims require original records and original human witnesses.

## Ree — original Windows computer (DESKTOP-AE894KC)

On Ree's computer, open PowerShell in `C:\Users\ree\rosevear-comms-hub-ql340`:

```powershell
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Status
```

The safe status should show `RECEIVER_OFF_OBSERVED_NOT_ACTIVE_STOP` only if
there are no listeners on 8788, `tailscale.exe serve status` returns exactly
`No serve config`, the Windows user and host match, and the original evidence
and TLS certificate are present. Otherwise it stays HOLD.

To save a **new, nonsecret** evidence document:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Capture
```

The script asks for the exact phrase `CAPTURE_RECEIVER_OFF_EVIDENCE` and
creates a never-overwritten JSON file under
`%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Evidence`. This does not alter
network services or the receiver. Keep the original evidence in Ree's custody.

Review format on the same machine (also safe for Jack's offline copy):

```powershell
node .\runtimes\hub-relay\ql344-off-attestation.mjs --inspect "FULL_PATH_TO_QL344_OFF_OBSERVATION.json"
```

## Jack — independent original-owner and issuer review

Jack uses **his own PowerShell**, in
`C:\Users\jfros\rosevear-comms-hub-ql340`, and independently reviews the
four original evidence files, the TLS certificate, the QL-343 nonsecret review
packet and both distinct public authority candidates. He must never receive
Ree's private key, passphrase or a receiver database password. Likewise, Ree
must never receive Jack's private key.

The offline CLI displays its argument order:

```powershell
node .\runtimes\hub-relay\ql344-off-attestation.mjs --help
```

After explicitly reviewing trustworthy originals, it can compare all four
original byte digests, TLS certificate byte digest, QL-343 packet and distinct
source/master public candidates:

```powershell
node .\runtimes\hub-relay\ql344-off-attestation.mjs --reconcile OBSERVATION.json QL343_REVIEW.json EVIDENCE_PATHS.json TLS_CERT.crt DEVICE_PUBLIC.json SOURCE_PUBLIC.json MASTER_PUBLIC.json
```

**Caution:** The QL-343 evidence path manifest names paths on Ree's PC. On
Jack's computer, create an equivalent nonsecret JSON map of Jack's copied
files with exactly four keys: `windows`, `privateTls`, `tailnetAcl`, `rollback`.
Never copy a private key or database credential. A copied issuer record is not
independently authenticated just because the bytes match.

## Signature and activation gate

- A valid QL-344 JSON **format** is not a genuine independent field witness.
- Matching bytes are not proof of issuer, PKI trust, Tailnet grant enforcement,
  live network connectivity or a successful receiver shutdown.
- The existing original QL-340B owner keys remain separate; **no new key is
  created**. The QL-344 script provides no signing or enrollment commands.
- Even with all public hashes and key IDs matching, it returns **HOLD** until
  independent original-issuer review and separately witnessed decisions from
  Ree and Jack are complete. QL-340B signing must not be attempted while the
  original issuer and receiver-state evidence is unresolved.
- Production `main` CI GREEN means the disabled-preview software is verified;
  it is not evidence of operational six-peer connectivity.

## CI safety assurance

Windows CI runs `-Status` on a runner (not Ree's PC); it must not write an
observation, sign, read secrets, or activate the receiver. Node tests reject
stale, mutated, elevated and hash-mismatched evidence, malformed candidates,
and attempts to use an unauthorized signer action. The QL-336A original 43
required gates and Windows owner-key tests remain intact.
