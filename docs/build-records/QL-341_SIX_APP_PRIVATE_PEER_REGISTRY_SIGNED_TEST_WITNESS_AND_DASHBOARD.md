# QL-341 — six-app private peer registry, signed TEST witness and owner dashboard

**Release interpretation:** `main` production CI GREEN means the reviewed application and migration were released. It does **not** mean a Windows receiver, an original-owner cryptographic enrollment or any of the six external app connections is live. Keep all customer communications, SMS, calls, data transfers and physical device actions disabled.

## What actually shipped

1. The private PostgreSQL table `public.master_hub_private_peers_ql341` has six **nonsecret** peer records under forced RLS: **Rosie Dazzlers**, **Devil n Dove**, **iCamp**, **Yard Workers** (businesses), **AI Data Platform**, and **Rosevear AI Hub** (support). All are `HOLD` with neither TEST authorization nor customer-data access. The dedicated role has read-only access; anonymous/browser roles have no access. The database migration does not create a user login, password, public service endpoint or external connector.
2. `ql341-private-readback.mjs` provides a **private, Windows-only PostgreSQL readback**. An optional **original** device-signed TEST heartbeat is checked against independently enrolled Ree/Jack owner signatures, revoked-key state and an **exact, immutable PostgreSQL HOLD receipt**. A successful TEST receipt still returns **zero connected peers**, and a missing or mismatched original witness remains HOLD. Synthetic keys used in unit tests are never enrollment evidence.
3. The Windows operator supports `-Readback` (and optionally `-SignedPacketPath`) only after a privately provisioned dedicated DB credential exists. It refuses to run while port 8788 is listening. It exports a nonsecret, timestamped JSON report to Ree's owner-restricted `Evidence` folder and does not open the receiver or contact any of the six apps.
4. The Comms Hub **I.T. → Connections** page includes a six-card, **read-only** status dashboard. It can display a local, nonsecret JSON readback chosen by the owner. Import neither uploads the file nor authenticates a live connection. The dashboard rejects altered/unscoped peer records and false-connected claims. All cards remain `DISCONNECTED / HOLD` regardless of a signed TEST heartbeat.
5. Required verification includes six-peer role/permission tests, real-cryptography synthetic test fixtures, forged receipt denial, a Windows CI verifier and the existing application release/security/build checks.

## Owner field evidence and remaining hard gates

Ree confirmed the following **seven paths exist** in the original Windows Hub owner folder: `ql339b-hub.public-candidate.json`, `OwnerAuthorities\source\source.public-candidate.json`, `Imports\jack-master.public-candidate.json`, `Evidence\windows-process-readback.json`, `Evidence\private-tls-chain.json`, `Evidence\tailnet-grants-readback.hujson`, and `Evidence\receiver-stop-preflight.json`.

File presence is **not proof of signature validation or field agreement**. The stop-preflight file proves a receiver-start attempt was prevented, **not** that a running receiver was stopped. The private TLS certificate was reported as valid through **2027-02-03** but is not by itself permission to connect. Jack's original master candidate is public-only; its private signing key remains exclusively on Jack's laptop. Ree's source private key and all receiver credentials stay on Ree's Windows machine.

Independent live database readback during this build confirms:

| Item | Actual result |
|---|---|
| Six peer records | `6`, all `HOLD` |
| Privileged/activated peer records | `0` |
| Dedicated receiver login | `NOLOGIN` |
| Reviewed original owner/device enrollments | `0` |
| Saved device heartbeat receipts | `0` |
| Private peer RLS | forced, dedicated SELECT policy |

The original QL-340B dual-owner ceremony, independently reviewed field evidence, a non-expired enrollment and a privately issued least-privilege PostgreSQL login **remain genuine blockers**. Do not insert fabricated owner approvals, mark any source connected, create new receiver credentials in GitHub, open a public port, enable Tailscale Serve or bypass these gates to get GREEN.

## Windows owner follow-up: safe commands

On **Ree's Windows PC** in the previously clean checkout:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
node .\runtimes\hub-relay\ql341-private-readback.mjs --help
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -Status
```

When an authorized DB administrator has **separately** issued and verified the dedicated receiver login and Ree has locally stored it via QL-340C `-StoreCredential`, the owner can install Node runtime dependencies and generate a **read-only** report:

```powershell
npm ci --prefix runtimes/hub-relay --omit=dev --no-audit --no-fund
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -Readback
```

`-Readback` currently halts at `HOLD_PRIVATE_DATABASE_CREDENTIAL_REQUIRED` until the missing private credential is supplied. Do **not** run `-Start` yet. Once a **genuine** original-signed device TEST packet, valid original owner pins and exact DB receipt exist, `-Readback -SignedPacketPath <owner-reviewed-json-path>` can additionally verify the packet. An unsigned candidate or preflight JSON is not a substitute. Import the generated `ql341-private-readback-*.json` via **I.T. → Connections → Load a private status readback**. Do not send the report through a public client API.

The four cloud-hosted applications do not need local Windows servers: a future independently enrolled, least-privilege service connector can operate from each approved cloud runtime. QL-341 installs **no such external connectivity** and grants no cloud app access into Ree's local server.

## Promotion and next build

Check the production Actions run for all required jobs **GREEN**, verify `dev` and `main` commit trees match, and independently verify the six rows and the `NOLOGIN` role. A GREEN build cannot be promoted into a claimed **GREEN connection** without original signed field evidence.

**Next recommended build — QL-342: Original-Owner Enrollment Decision, Private Credential Handoff & One Verified TEST Receipt.** Keep this a separate owner-supervised gate; do not enable live customer traffic or device actions.

References: [QL-340B offline owner signing](./QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md), [QL-340C private receiver custody](./QL-340C_PRIVATE_RECEIVER_CREDENTIAL_VAULT_AND_SUPERVISED_STARTUP.md), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Tailscale access control](https://tailscale.com/docs/features/access-control).
