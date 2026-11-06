# QL-345 — Independent Issuer Confirmation, Separate Owner Decisions & Offline TEST Request Preflight

## Result

Adds a time-limited, offline, public-only review challenge binding the QL-344
receiver-OFF observation, QL-343 original evidence digest packet, the public
device identity and Ree/Jack's **distinct original Ed25519 public keys**.

It also supports **separate original-owner signatures on REVIEW dispositions**:
`HOLD`, `REJECT`, or `REVIEW_ACKNOWLEDGED_NO_ENROLLMENT`. Even if both owners
cryptographically acknowledge the exact challenge, **the result is not
enrollment authorization**. QL-340B enrollment and the receiver remain OFF.

The original issuer's independent attestation is still missing. Hash matching,
public key format validation, Windows file readback, a certificate chain check,
and an accepted Tailscale ACL test do **not** by themselves authenticate a
third-party source issuer. A genuine external issuer record must be obtained
and independently verified before later controlled authorization.

## Procedure — Ree's original Windows PC only

Open PowerShell in `C:\Users\ree\rosevear-comms-hub-ql340`:

```powershell
git status -sb
git pull --ff-only origin main
node .\runtimes\hub-relay\ql345-issuer-owner-preflight.mjs --help
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Status
```

If the original receiver still has no listener on 8788 and Tailscale Serve
has no config, capture a **fresh QL-344 OFF observation** (never an active stop):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql344-windows-off-observer.ps1 -Capture
```

Only after reviewing **the four original evidence files** and independently
confirming which issuer actually produced them, create a 20-minute
non-authorizing public challenge:

```powershell
node .\runtimes\hub-relay\ql345-issuer-owner-preflight.mjs --stage-local `
  "FULL_PATH_TO_QL344_OFF_OBSERVATION.json" `
  "FULL_PATH_TO_QL343_REVIEW_PACKET.json" `
  "$env:LOCALAPPDATA\RosevearAIHub\CommsRelay\ql339b-hub.public-candidate.json" `
  "$env:LOCALAPPDATA\RosevearAIHub\CommsRelay\OwnerAuthorities\source\source.public-candidate.json" `
  "$env:LOCALAPPDATA\RosevearAIHub\CommsRelay\Imports\jack-master.public-candidate.json"
```

The output points to the *public* JSON challenge in Ree's private Evidence
directory. No private key is copied. If the challenge cannot be prepared,
do not bypass the HOLD: collect fresh original evidence and retry.

## Procedure — two separate original owners

Ree and Jack may each separately record a **review-only** decision **after
independent inspection**. Their passphrases stay hidden in their own PowerShell.
The challenge expires after 20 minutes, so coordinate only the review timing;
never transmit either person's private key or passphrase.

**Ree:** on her original PC, in her repo folder:

```powershell
node .\runtimes\hub-relay\ql345-issuer-owner-preflight.mjs --decide source "CHALLENGE.json" HOLD
```

**Jack:** on his separate laptop, in
`C:\Users\jfros\rosevear-comms-hub-ql340`:

```powershell
node .\runtimes\hub-relay\ql345-issuer-owner-preflight.mjs --decide master "CHALLENGE.json" HOLD
```

For either owner, choose the exact `HOLD`, `REJECT` or
`REVIEW_ACKNOWLEDGED_NO_ENROLLMENT` disposition only after inspecting the
original evidence. A hidden prompt requires typing `ACK_REVIEW_ONLY` to
confirm that this is **not** permission to enroll or activate.

Each command writes a nonsecret detached review decision to that owner's own
local private authority folder. Transfer only public challenge/decision JSONs.
The signing process does not create, export, replace or transmit private keys.

With both public review decisions available on the same computer:

```powershell
node .\runtimes\hub-relay\ql345-issuer-owner-preflight.mjs --check `
  "CHALLENGE.json" "REE_SOURCE_DECISION.json" "JACK_MASTER_DECISION.json"
```

Both valid review signatures mean only that the **same original challenge**
was reviewed. The response remains HOLD, because there is no independent
issuer authentication or owner enrollment authorization. A `HOLD` or `REJECT`
disposition also remains HOLD. No TEST request is emitted by QL-345.

## To complete independent issuer confirmation in a later controlled step

1. Identify the **original** Windows source and the original issuer of the
   TLS certificate and Tailnet ACL. Reconcile the issuer-supplied references
   against the actual, freshly captured QL-344 byte digests and host identity.
2. Independently authenticate the issuer's record or cryptographic signature
   using trusted out-of-band provenance; do not pin a public key supplied
   solely by the same untrusted record.
3. Ree and Jack each decide separately on a fresh, exact, narrowly scoped
   TEST enrollment after verifying the issuer and the intended destination.
4. Only then use the *separate* QL-340B signed-enrollment ceremony and its
   database authority checks; the QL-345 review signatures are never valid as
   QL-340B enrollment signatures.

`main` Production GREEN confirms only the disabled-preview software
deployment, not operational six-app integrations or authorization to connect.

## Required regression coverage

Five new Node tests cover fresh short-lived challenges, public candidate
separation, withheld issuer authority, independent authentic Ed25519 review
signatures, stale/mismatched/tampered/rejected decisions, and rejection of
nonoriginal Windows signer actions. Two new UI tests check non-authorizing
review presentation. All original 43 QL-336A gates and Windows owner-key
tests remain protected.
