# QL-340C — private receiver credential vault and supervised lifecycle

**Release meaning:** production source can be GREEN while the physical private connection is **DISCONNECTED / HOLD**. This build never starts the Windows receiver, creates a live DB password, signs on behalf of either original owner, changes Tailscale Serve, or enables calls, texts, customer access, or device actions.

## What changed

1. A dedicated **NOLOGIN** `ql340c_private_receiver` PostgreSQL role, scoped via forced RLS to read one reviewed TEST device enrollment and revocation, and to insert only an append-only HOLD heartbeat receipt for `rosevear-windows-hub / hub-probe`. No anonymous/browser privileges, credential, UPDATE or DELETE access is created.
2. A Windows-only `ql340c-windows-operator.ps1` with five explicit actions: `-Status` (read only), `-SelfTest` (synthetic Windows current-user DPAPI test), `-StoreCredential` (hidden entry, encrypted in Ree's local user profile, never overwritten), `-Start` (real original-owner signatures, matching device, nonexpired TEST enrollment, private certificate, Tailscale Serve OFF and typed consent required), and `-Stop` (verify exact local process identity and actual closed listener, then create a field stop receipt needing independent review).
3. The receiver tests its **actual PostgreSQL login role before binding** to `127.0.0.1:8788`; a plausible-looking or overprivileged DSN cannot start the private HTTP listener. Synthetic negative tests and Windows CI remain required release gates.

## Ree's original Windows Hub — safe first commands

Use the existing **clean** checkout (`C:\Users\ree\rosevear-comms-hub-ql340`), not Ree's older dirty repository. After verified promotion to `main`, open PowerShell as Ree and run:

```powershell
cd C:\Users\ree\rosevear-comms-hub-ql340
git status -sb
git pull --ff-only origin main
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -Status
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -SelfTest
```

`-Status` does not unlock any credential, connect to the database or open a port. `-SelfTest` encrypts/decrypts only a synthetic value. Keep the actual Windows Hub running its existing AI Hub services, Caddy port 8443, and Tailscale settings. The obsolete scheduled task `Rosevear AI Server Startup` was disabled separately because its script path no longer existed; do not revive it.

## Necessary private owner handoff, in order

1. An **authorized private PostgreSQL administrator** reviews the migration and chooses a new dedicated, random credential for `ql340c_private_receiver`. The migration intentionally leaves that role `NOLOGIN`; do **not** enable it or set a password just because source code is GREEN. After independent approval, provisioning must be performed by the original database administrator, not by publishing the secret to GitHub, browser settings, chat, Vite or the public Cloudflare Worker. Pooler credentials must authenticate to that exact dedicated role.
2. Ree and Jack complete [QL-340B's original-owner enrollment ceremony](./QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md) independently. Review **real** evidence from the original issuer; the `receiver-stop-preflight.json` is only a negative startup proof, **not** a witnessed stop of a running receiver. Do not silently upgrade that document into an active-stop attestation. The enrollment is deliberately short-lived (at most 20 minutes). The matching original signed TEST record must be independently verified and inserted into the protected enrollment table by an authorized DB operator **before it expires**. No dummy approvals or synthetic fixture data.
3. Only when a real dedicated DSN is privately issued to Ree, use `-StoreCredential` on **Ree's Windows account**. It prompts for the entire URL with hidden input; never paste the URL into terminal command arguments or share it. It rejects DB usernames other than `ql340c_private_receiver` (or its exact project-specific pooler form). The generated file is current-user DPAPI encrypted under `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Receiver` with owner-only ACLs; Jack's laptop cannot decrypt it. There is no overwrite, unattended rotation, or backup transfer.
4. Once the true signed files, valid certificate, approved Tailnet access, and DB credential exist, first run `npm ci --prefix runtimes/hub-relay --omit=dev --no-audit --no-fund` in the clean Windows checkout. The owner may then use `-Start`. It requires typing `START_TEST_RECEIVER`, checks the exact signed device/workload and short expiry, confirms no Tailscale Serve config, and launches the receiver **foreground only** on loopback port 8788. This is a single supervised TEST, not an installed Windows service. The dedicated DB role is verified before listening. On another owner terminal, `-Stop` validates the process and actual port closure; its timestamped evidence requires independent owner review.
5. Only after a reviewed, one-time, device-key-signed TEST heartbeat and PostgreSQL HOLD receipt are obtained can the private transport be reported as authenticated. Real six-app exchange needs separate contracts, peer enrollment, and owner acceptance. An HTTPS certificate, GREEN CI, an open local Caddy port, or the existence of a PostgreSQL role alone proves **none** of those events.

The operator deliberately provides **no automatic password provisioning, database enrollment, Tailscale Serve exposure, background startup, or live dispatch**. Absent original owner authority or private DB credentials, stop at `-Status` / `-SelfTest`. Do not move passwords or private signing keys between Ree's server and Jack's laptop.

## Checks and next phase

Run from repository root:

```powershell
node --test .\runtimes\hub-relay\ql340c-activation-check.test.mjs .\runtimes\hub-relay\server.test.mjs
```

`app-ci.yml` requires these plus a synthetic Windows DPAPI test; all original 43 application gates remain unchanged. The migration must be inspected for its `NOLOGIN` status, table permissions and three role-specific RLS policies after an independently authorized deployment.

**Next recommended build:** **QL-341 — Six-App Private Peer Registry, Signed TEST Heartbeat Witness & Read-Only Connection Dashboard.** Proceed only after actual QL-340B owner signatures, a dedicated DB login, one genuine scoped receipt, and verified supervised stop. No customer communication or physical device actions until separately authorized.

References: [Supabase database security](https://supabase.com/docs/guides/database/secure-data), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Tailscale access controls](https://tailscale.com/docs/features/access-control/acls), and [QL-340B](./QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md).
