# QL-342 — original-owner enrollment decision, private credential handoff and one verified TEST receipt

**Production source release is not physical activation.** This release provides the real, owner-supervised verification steps. It does **not** claim an original device heartbeat occurred, manufacture a signature, create a database password, enable a receiver, connect any of the six peers or permit customer/device operations.

## Actual owner state at start

Ree's original machine `DESKTOP-AE894KC` returned:

```json
{"schema":"rosevear.hub.ql340c.private-operator.v1","state":"RECEIVER_OFF_OR_REVIEW_REQUIRED_READ_ONLY","computer":"DESKTOP-AE894KC","customerCommunications":false,"deviceActions":false,"credentialEncryptedOnDisk":false,"signedEnrollmentPresent":false,"ownerPublicPinsPresent":false,"localListenerCount":0}
```

The independent protected PostgreSQL readback also returned **six held private peer rows, zero signed device enrollments, zero durable heartbeat receipts and `ql340c_private_receiver` still `NOLOGIN`**. These are true blockers, not a test failure. Seven pre-existing candidate/evidence files are present, but their presence alone is not proof of an original issuer or a witnessed stop.

## What QL-342 adds

1. **Original-owner decision verifier:** `ql342-owner-decision.mjs` independently verifies the *actual* dual Ed25519 signatures against Ree's source and Jack's separate master public candidates, the original device candidate, a short-lived TEST enrollment, and freshly recomputed hashes of four locally selected field evidence files. It rejects different keys, copied keys, changed evidence, future/expired approvals and altered device scope. A cryptographic match produces a nonsecret **HOLD review document**. It is **not** an automatic field witness, database enrollment or owner authorization. A preflight-only rollback document is clearly **not** an active receiver stop.
2. **Credential handoff safeguards:** the Windows operator has `-OwnerPreflight`, `-ReviewEnrollment -EvidencePathsFile` and `-VerifyOneReceipt -OriginalPacketPath -OwnerReviewPath`. Actual PostgreSQL credentials are still accepted only through QL-340C's hidden, current-Ree-user DPAPI `-StoreCredential`; no credential or private key can be placed into source, chat or UI. No database login is created by this build. An independent administrator must authorize and provision the least-privilege role after real signatures and field decisions.
3. **Exactly one real TEST receipt verifier:** an original signed device health-only packet is compared with one independently stored `REVIEWED_TEST` enrollment and **exactly one** immutable HOLD receipt, with the dedicated DB login role and a short freshness window. Zero or multiple receipts, fabricated signed packets, an unrelated enrollment, expired proof, revoked keys or a privileged DB role are refused. A valid TEST returns **still HELD; 0/6 peers connected**.
4. **Owner guidance in I.T. → Connections:** a four-stage QL-342 handoff panel explains the independent work and can read a locally exported **nonsecret** Windows preflight JSON. Import remains a display-only owner claim, never authentication, remote access or data modification.
5. **Required CI:** original 43 application checks plus QL-340/341 custody and QL-342 owner/receipt/Windows tests. Production and public disabled-preview gates stay fail-closed.

## Step 1 — safe field preflight on Ree's Windows machine

In PowerShell (the preflight does not open a receiver port, use a DB credential, sign anything or make network requests):

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -OwnerPreflight
```

To save an optional nonsecret JSON for import on the Comms Hub Connections page:

```powershell
$privateEvidence = Join-Path $env:LOCALAPPDATA 'RosevearAIHub\CommsRelay\Evidence'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -OwnerPreflight |
  Out-File -FilePath (Join-Path $privateEvidence ('ql342-preflight-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')) -NoClobber -Encoding utf8
```

The three public candidates already exist on the original machines. The actual new blocker from the submitted status is **both signatures and the private DB credential**; no owner has been asked to transmit a private key.

## Step 2 — independent original-owner decision

Using [QL-340B's owner signing runbook](./QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md), Ree reviews four **genuine** original field records, including an effective rollback/stop witness. The existing `receiver-stop-preflight.json` only proves that a receiver start was blocked. It must **not** be relabeled as a witnessed stop of a running process. The original device `ql339b-hub.public-candidate.json` belongs to Ree's Windows server. The `source` owner key stays there. Jack signs the **same exact reviewed request digest** with his own local `comms-master-jack-ql340a` master key on his laptop. No keys, passphrases or DSNs travel between machines. Both approval signatures must be made inside the short **20-minute** enrollment interval.

After an authentic QL-340B `--assemble` has produced **both** owner-approved files, and the four actual evidence paths are recorded in a JSON map with keys `windows`, `privateTls`, `tailnetAcl`, `rollback`, Ree may run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -ReviewEnrollment -EvidencePathsFile "C:\owner-reviewed\evidence-paths.json"
```

The provided path is an **example**. The review document records authentic cryptographic checks and leaves **field approval HOLD** until an independent original human witness/database decision. If it fails because the short window expires, redo the original owner review and signatures; do not change a signed payload or disable the expiry limit.

## Step 3 — confidential credential handoff (not automatic)

An independent private database administrator reviews the two authentic signatures, original field records, nonexpired enrollment, scope and rollback plan; only then can they authorize **one dedicated, least-privilege** `ql340c_private_receiver` login and privately provision its unique credential. It must not be a `postgres` or `service_role` credential. **This build intentionally leaves `NOLOGIN` unchanged.** After a real handoff, Ree uses QL-340C's `-StoreCredential` **locally** and enters the full URL only at the hidden prompt. This stores it encrypted under Ree's current Windows identity, without printing or committing it. Do not paste the private URL into chat, shell command arguments, the browser or a hosted environment variable.

The independent database operator then verifies and inserts the **exact** cryptographically signed TEST enrollment into the existing append-only RLS-protected table. A present local signed file is **not** a database enrollment and does not imply the role can log in. If original owner/administrator approval is missing, stop after `-OwnerPreflight`.

## Step 4 — one actual TEST receipt and owner readback

Only once the original owner-approved **foreground** receiver is explicitly started, it may process **one** original device-signed TEST heartbeat with capability scope restricted to `health.read` and `capabilities.read`. It must remain on `127.0.0.1:8788`; never configure public Tailscale Serve, cloud-to-home ingress, calls, texts, customer records or device actions. After a verified real stop and independently reviewed HOLD receipt, keep the receiver OFF and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -VerifyOneReceipt -OriginalPacketPath "C:\owner-reviewed\original-device-heartbeat.json" -OwnerReviewPath "C:\owner-reviewed\ql342-owner-review.json"
```

Both quoted paths are examples, not known actual files. The verifier reads from the dedicated private PostgreSQL role and writes one local **nonsecret** timestamped `ql342-one-test-receipt-*.json` only if the original signature, original-owner enrollment, exact receipt and freshness all independently validate. Otherwise it exits nonzero and leaves the connection **HOLD**. A synthetic CI fixture cannot be used as the real packet or owner review.

**At release:** the original owner approval, private credential and exact receipt are **not yet present**. The source can be GREEN while the physical six-app transport remains `DISCONNECTED / HOLD`.

## Security and next build

This phase makes **no schema or privilege changes** to the already protected Supabase device enrollment, receipt or six-peer tables; there is deliberately no privilege-expanding migration. Read-only DB state and RLS must be checked again after any future supervised owner decision. The one actual receipt can prove one TEST device transaction, **not** that all six separate cloud peers have been enrolled.

**Next recommended build — QL-343: Independently Witnessed First Cloud Peer TEST Handshake, Tenant-Scope Consent & Multi-App Connection Proof.** Keep all production customer/device capabilities OFF until independently approved.

References: [Supabase column-level security](https://supabase.com/docs/guides/database/postgres/column-level-security), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [QL-340C Windows credential custody](./QL-340C_PRIVATE_RECEIVER_CREDENTIAL_VAULT_AND_SUPERVISED_STARTUP.md), [QL-341 six-peer registry](./QL-341_SIX_APP_PRIVATE_PEER_REGISTRY_SIGNED_TEST_WITNESS_AND_DASHBOARD.md).
