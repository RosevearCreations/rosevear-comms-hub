# QL-506 — Original-host enrollment evidence and independent readback

**28 November 2026 · Rosevear Comms Hub only · Source: QL-505 release, owner-approved follow-on and Comms field tracker**

## Code delivery

- A **fourth, independently pinned Ed25519 service-identity key** checks a short-lived original-host enrollment *claim* against an exact Comms project, source/tenant, worker-bundle digest and private journal digest. It must be distinct from original-source, independent-provider and third-party reviewer signing keys.
- A deterministic private metadata-only exception-ledger projection is sorted by exception ID and SHA-256 hashed. The existing QL-505 independent reviewer must sign this exact digest with the QL-505 schema and matching record count, source/tenant and job digest. Forgery, changed row, stale proof, unauthorized app, changed job, duplicate exception, wrong host, reused signer or missing row all return HOLD.
- The QL-506 offline CLI provides a **safe read-only local inventory**: status on any host, optional journal count inspection on the original Ree Windows host. Neither CLI nor reconciliation module reads keys, creates credentials, calls a provider/database, grants tenant authorization, installs/runs a service or activates the QL-340C receiver.
- CI runs Node negative and positive fixture tests on Linux and Windows. Signed test-only keypairs are NOT real field enrollment. The private proof verifier remains outside the browser bundle; no new public routes or database migration.

## Exactly what is and is not certified

**Code GREEN** requires dev and main protected CI green plus public Worker JS/CSS parity on the exact main SHA. **Physical field HOLD** remains until an *independent* original-device observation, a separately supervised credential/key enrollment, an authorized private Comms ledger read and genuine provider witness are presented. A signed claim can be valid even if the named Windows service is stopped; no claim can assert human acknowledgement. CI and code promotion cannot perform or infer physical field attestation.

No real signature, provider delivery, client-facing send, or tenant grant is fabricated. The old QL-340C TEST receiver must remain OFF. Do not re-run earlier owner inventories. No other application needs to halt its builds or supply customer data.

## Safe one-shot local instructions (optional, not needed for code promotion)

On **DESKTOP-AE894KC** as Ree, with existing Comms code in `C:\rc470`, open **PowerShell** and run:

```powershell
Set-Location C:\rc470
git fetch origin main
git switch main
git pull --ff-only origin main
node .\runtimes\master-discovery\ql506-original-host-cli.mjs --status
node .\runtimes\master-discovery\ql506-original-host-cli.mjs --inspect
```

The first call works anywhere and shows code HOLD; the second is read-only and host-restricted, reports only journal counts if accessible, and does not generate a production attestation or enable the receiver. Do not post local private files, secrets, private keys, signed provider packets or customer details in GitHub/chat.

The operator or independently approved local supervisor must separately provide original device/service evidence, four public-key pins, exactly authorized source and tenant, service-only Comms credentials stored securely, and a genuine private ledger review before even requesting a controlled field pilot. That is **not** authorized by this build alone.

## Follow-up gate

QL-507 should be selected from observed Comms-owned gaps rather than promising a live receipt pilot. The specific unresolved physical witness, service identity custody and independently observed provider record stay separately tracked as HOLD.
