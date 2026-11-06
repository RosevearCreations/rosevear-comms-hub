# QL-351 — Original Windows Private Adapter Installation, Owner Enrollment Completion & First Supervised Rosevear AI Hub TEST Handshake

## What GREEN means and what it does not

QL-351 ships a Windows-only **locally staged, pinned adapter record** plus the owner-facing procedure inside **Comms Hub → I.T. → Connections · six apps → QL-351 walkthrough**. The record is not a Windows service and does **not** activate the still-unconfigured QL-350 authenticated private bridge. The actual Windows adapter cannot be installed from GitHub CI: it must be staged on Ree's original PC. Original-owner signatures, restricted DB enrollment, a real signed heartbeat, an independently read-back receipt and a separately authenticated bridge must all precede any claim of a working connection.

At the start of this build, protected project `gxujcwpktaickcgzyvnu` returned **0** enrolled original devices, **0** original signed relay receipts and **6** peer connections on `HOLD`. The presence of Windows/Tailscale/Caddy, a public manifest, a stored key candidate, or a GREEN `main` release cannot change that fact. **No private enrollment or live TEST has been performed by CI.**

## Exact locations: where each owner works

| Place | Open this screen or location | Do here | Do not do here |
|---|---|---|---|
| Rosevear Comms Hub public operator page | **I.T. → Connections · six apps → QL-350 / QL-351** | Open walkthrough; **Check private bridge**; view six `HOLD` states | Paste passwords, private PEMs, bypass a disabled TEST button |
| Ree's **original** Windows mini-server `DESKTOP-AE894KC` | **PowerShell** in clean `rosevear-comms-hub` checkout, branch `main`; existing `%LOCALAPPDATA%\RosevearAIHub\CommsRelay` | Stage adapter, inspect DPAPI presence, original owner `source` signature, observe supervised receiver and stop | Regenerate existing key pair, overwrite encrypted file, enable Tailscale Serve |
| Ree's Rosevear AI Hub local client | Browser on Ree server at `http://127.0.0.1:5173` if it is running; view its available **System Status / connection diagnostic** section | Compare its **local app health** with authentic **Comms** connection state | Treat a responsive AI Hub page as an authenticated Comms handshake |
| Jack's **separate laptop** | PowerShell in local `rosevear-comms-hub` checkout and original local `master` owner key | Independently inspect/review/sign the **same exact** short-lived request | Transfer master private PEM or passphrase to Ree |
| Private approved database administration | Supabase project `gxujcwpktaickcgzyvnu` → **Database → Tables** or restricted SQL/operator workflow; tables `master_hub_device_enrollments_ql339b`, `master_hub_relay_receipts_ql338`, `master_hub_private_peers_ql341` | Read actual rows; a separately approved private administrator performs narrowly scoped enrollment with genuine source + master owner authority | Change `HOLD` manually; issue a privileged DSN to the browser or remove RLS |
| Existing private Caddy/Tailscale configuration | Ree server, local Caddy configuration and `tailscale.exe status` / `tailscale.exe serve status` | Verify trusted certificate, approved tailnet route, no public ingress | Point public GitHub Pages to a private credentials endpoint |

There is **one** Hub installer/checker for the first original device. There is **not** a new secret to paste into each of the other five apps. Those sources already publish their integration manifests; later source-specific approvals are independent.

## A. Update and stage the original Windows adapter (Ree; one-time)

1. On Ree's original Windows server, open **PowerShell** under Ree's usual Windows account. Do not run this on Jack's laptop or GitHub Actions. If the prior clean checkout still exists at `C:\Users\ree\rosevear-comms-hub-ql340`, use it. Otherwise select a **clean** checkout of the repository, not an existing dirty one.
2. From that checkout run these commands **one line at a time**:

   ```powershell
   cd C:\Users\ree\rosevear-comms-hub-ql340
   git status -sb
   git fetch origin
   git switch main
   git pull --ff-only origin main
   git status -sb
   node --version
   ```

   Stop if there are local changes or a conflict. Do not stash/delete changes without a separate owner decision. Node **22 or 24** is required by the staged checker.
3. Run the read-only inspection and see whether the previous encrypted credential/enrollment files are *present* (it prints booleans, never secret contents):

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -Status
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -Status
   tailscale.exe serve status
   ```

4. If the existing receiver is OFF and the checkout matches clean `origin/main`, stage the local pinned adapter:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -Install
   ```

   Type **`STAGE_QL351_ORIGINAL_WINDOWS`** when prompted. This creates only `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Adapter\ql351-installed.json`, protected by a current-user ACL. It pins the exact checkout SHA and SHA-256 hashes of required scripts. It **will not overwrite** a previous installation, existing keys, DPAPI material, enrollment documents, system services, or source repositories. A future checkout change causes an explicit provenance `HOLD`, not an unnoticed executable swap. **No network listener is opened.**
5. If it says `DENY_EXISTING_ADAPTER_INSTALLATION_NO_OVERWRITE`, STOP and inspect it before deciding a future supervised upgrade procedure. Do not delete the previous installation file to force progress.

## B. Inspect real evidence; do not repeat completed key setup

6. On Ree's **PowerShell** run:

   ```powershell
   node .\runtimes\hub-relay\owner-authority-custody.mjs --inspect
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -Preflight
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -Readback
   ```

   `-Readback` reuses **only** the existing user-bound encrypted DPAPI credential, if properly provisioned, and runs the QL-341 private read-only reconciliation while the receiver is OFF. If it is missing or the `ql340c_private_receiver` role is still `NOLOGIN`, stop and arrange a narrow, separately authorized private DB credential. **Do not reuse the Supabase service-role key.**
7. Verify the **four real independently obtained field records**, not synthetic fixtures: Windows process/task identity, exact private TLS/SPKI, restrictive Tailnet ACL, and receiver **real-stop** witness. See [QL-340B](./QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md), [QL-344](./QL-344_INDEPENDENT_RECEIVER_OFF_AND_ISSUER_RECONCILIATION.md) and [QL-346](./QL-346_INDEPENDENT_ISSUER_TRUST_OWNER_AUTHORIZATION_AND_CONTROLLED_TEST_READINESS.md). Their presence does not automatically prove authenticity; human owners verify original issuing sources.

## C. Two independent owners approve the one exact 20-minute TEST request

8. **Ree on original server:** transfer *only* Jack's **public** master candidate to an independently identified path. Build a JSON file mapping actual four evidence paths to keys `windows`, `privateTls`, `tailnetAcl`, `rollback`. Do **not** use the old master candidate that resides under Ree's account as Jack's independent authority.
9. **Ree on original server:** prepare the exact request with the documented four positional paths (replace bracketed paths with **real** existing local files):

   ```powershell
   node .\runtimes\hub-relay\ql340b-ceremony.mjs --prepare "<REAL_DEVICE_PUBLIC_FILE>" "<REE_SOURCE_PUBLIC_FILE>" "<JACK_MASTER_PUBLIC_FILE>" "<FOUR_EVIDENCE_PATHS_JSON>" "<PRIVATE_REQUEST_OUTPUT_JSON>"
   node .\runtimes\hub-relay\ql340b-ceremony.mjs --inspect-request "<PRIVATE_REQUEST_OUTPUT_JSON>"
   ```

10. **Ree on original server:** independently check request SHA-256, evidence digests, origin, short expiry, and scope. Only if Ree approves the exact TEST, sign *source*:

    ```powershell
    node .\runtimes\hub-relay\ql340b-ceremony.mjs --sign source "<SAME_REQUEST_JSON>" "<ACTUAL_64_CHARACTER_REVIEWED_PAYLOAD_SHA256>" "<REE_SOURCE_APPROVAL_OUTPUT_JSON>"
    ```

11. **Jack on his laptop:** receive *only* the public request and nonsecret evidence digests. In **his laptop's PowerShell** independently inspect the same request, compare the same 64-character digest, then separately decide whether to sign *master* with **his local key**:

    ```powershell
    node .\runtimes\hub-relay\ql340b-ceremony.mjs --inspect-request "<SAME_REQUEST_JSON>"
    node .\runtimes\hub-relay\ql340b-ceremony.mjs --sign master "<SAME_REQUEST_JSON>" "<ACTUAL_64_CHARACTER_REVIEWED_PAYLOAD_SHA256>" "<JACK_MASTER_APPROVAL_OUTPUT_JSON>"
    ```

    If either owner declines or evidence is incomplete/expired, **STOP**. Do not use automated approvals.
12. **Ree on original server:** bring back only Jack's nonsecret signed approval; assemble the exact three records before expiry:

    ```powershell
    node .\runtimes\hub-relay\ql340b-ceremony.mjs --assemble "<SAME_REQUEST_JSON>" "<REE_SOURCE_APPROVAL_JSON>" "<JACK_MASTER_APPROVAL_JSON>"
    ```

    This creates short-lived, non-overwriting `Enrollment\ql340b-signed-test-enrollment.json` and public pins in Ree's local app-data directory. **It does not write the database**; if it expires, both owners must approve a genuinely fresh request.

## D. Dedicated private database and first genuine TEST

13. **An authorized database operator (separate authority):** compare both original signed approvals against the exact enrollment payload; only after independent proof enroll the single original `rosevear-windows-hub` / `hub-probe` / `hub-ql339b` record with state `REVIEWED_TEST` through the approved protected procedure. Check `master_hub_device_enrollments_ql339b` on the **Supabase Database** screen. Do **not** attempt a blanket table edit, RLS bypass, fake receipt, or a browser-injected request. **Important current blocker:** QL-351 itself does not ship an authorized owner-attested database enrollment executor or an authenticated Caddy/QL-350 adapter service. An administrator must explicitly provision and verify these before live execution; simply having this walkthrough is insufficient.
14. **Ree on original server:** only when signed enrollment is valid, certificate/Tailnet ACL are verified, and dedicated private DB credential already exists, run:

    ```powershell
    npm ci --prefix runtimes/hub-relay --omit=dev --no-audit --no-fund
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -SupervisedReceiver
    ```

    Read the second confirmation; type **`START_TEST_RECEIVER`** only if we are ready to supervise the original receiver. It verifies signed enrollment and starts the existing Node receiver **foreground, on 127.0.0.1:8788 only**. It is not a cloud endpoint, public Pages route or Windows auto-start task. Keep the terminal open while witnessing exactly one original device-key-signed, metadata-only heartbeat generated through the independently approved QL-339B private sender. **This release does not supply an unattended heartbeat sender.**
15. **Ree in a second PowerShell window:** after the one controlled TEST, stop with the existing strict operator:

    ```powershell
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -Stop
    ```

    Record the stop witness and confirm port 8788 listener count is zero. No automatic retry. If the receiver has already exited or the process identity mismatches, follow its fail-closed output; do not terminate an unrelated process.
16. **Ree on original server, receiver OFF:** with the real original signed packet and independent QL-342 owner review file:

    ```powershell
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -VerifyOneReceipt -OriginalPacketPath "<REAL_ORIGINAL_SIGNED_PACKET_JSON>" -OwnerReviewPath "<REAL_QL342_OWNER_REVIEW_JSON>"
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql351-windows-private-adapter.ps1 -Readback
    ```

    Verify exactly one durable **append-only `HOLD` receipt** in `master_hub_relay_receipts_ql338`, matching original device signature, counter and enrollment. A HOLD receipt is not a persistent Comms connection. A valid request followed by a missing/invalid receipt stays HOLD.
17. **Back in Comms Hub → I.T. → Connections:** click **Check private bridge**. It will only recognize the device after the original owner-authenticated, same-origin Caddy/Tailnet QL-350 private sidecar, DB readback and exact signed receipt verification are independently installed. The static public preview will continue to report **No authenticated private bridge** even if the Windows receipt exists. A browser button cannot install or authenticate a Windows service remotely.

## E. Remaining five application handshakes — where to work

Only after the **first** real Rosevear AI Hub TEST receipt and private bridge are verified, repeat the *source-specific* signed health GET for one application at a time from **Comms Hub → I.T. → Connections → QL-350 six TEST buttons**. Each source's contract/authority is maintained in its **own repository**, not in the selected business tab in Comms Hub. Do not silently overwrite their current dev/main builds.

| Comms Hub TEST target | Which application repository and owned manifest to inspect | Source-specific approval/verification |
|---|---|---|
| **Rosevear AI Hub (first)** | `rosevear-ai-hub` → `apps/web/public/.well-known/rosevear-integration-manifest.json` | Ree's original device signer, then exact authenticated health GET and source witness |
| **Rosie Dazzlers** | `rosiedazzlers` → `.well-known/rosevear-integration-manifest.json` | Original Rosie Dazzlers source-owner TEST approval and its append-only receipt |
| **Devil n Dove** | `devilndove-site` → `.well-known/rosevear-integration-manifest.json` | Independent Devil n Dove source/issuer authority; no Etsy or customer data trial |
| **Yard Workers** | `yw` → `public/.well-known/rosevear-integration-manifest.json` | *Platform shell-level* approval, not each customer/landscaping business |
| **iCamp** | `iCamp` → `public/.well-known/rosevear-integration-manifest.json` | *Platform shell-level* approval, not Camp Rosevear or each campground |
| **AI Data Platform** | `ai-data-platform` → `apps/web/public/.well-known/rosevear-integration-manifest.json` | Platform broker and independent source TEST custody; no shared customer data |

For every source: open its corresponding code repository/integration manifest as the known authoritative location; verify deployed revision and `/api/integration/v1/shell/health` endpoint, check its own source authorization, select the single source button in Comms Hub, retain signed reply and independent witness. If the corresponding app has an Integrations/Connections page, it is for **observability**, not a substitute for these source-held approvals. This runbook intentionally does not invent menu labels for unverified source-app screens.

## F. What to report back (never include secrets)

For the first device, supply only redacted output/state of `-Status`, `-Preflight`, `-Readback`, `-Install` (if completed) and whether the exact device enrollment and durable signed receipt independently exist. **Never** send password, DATABASE_URL, owner private PEM, signed passphrase, recovery phrase, raw auth cookie or privileged bearer token. If one gate is missing, we isolate that gate and leave all six peers `DISCONNECTED / HOLD`.

## Build verification and references

- Node tests: `node --test runtimes/hub-relay/ql351-windows-private-adapter.test.mjs`
- Windows CI: `pwsh -NoProfile -File ./runtimes/hub-relay/ql351-windows-private-adapter.ps1 -Status` **only** on an ephemeral runner, confirming no installation.
- QL-336A Ubuntu required gates, Windows required original-key checks, frontend UI test and build, `main` asset parity and Pages smoke proof must all remain GREEN.
- [QL-340B original-owner enrollment](./QL-340B_OFFLINE_OWNER_SIGNING_AND_FIELD_HANDSHAKE.md)
- [QL-340C supervised Windows receiver](./QL-340C_PRIVATE_RECEIVER_CREDENTIAL_VAULT_AND_SUPERVISED_STARTUP.md)
- [QL-350 authenticated bridge boundary](./QL-350_PRIVATE_CONNECTION_CONTROL_BRIDGE.md)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Tailscale access-control grants](https://tailscale.com/docs/features/access-control/grants)

**Next recommended build (after authentic field evidence): QL-352 — Owner-Authorized Database Enrollment Executor, Original Private Session Activation & Signed One-TEST Witness Closure.** It must not claim success without original owner and independent issuer custody.
