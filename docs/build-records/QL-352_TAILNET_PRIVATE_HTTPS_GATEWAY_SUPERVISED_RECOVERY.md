# QL-352 — Tailscale-only HTTPS gateway, original-owner staging and safe recovery

## Outcome and strict scope

This release adds an optional, **separate**, original-Windows-owner-supervised HTTPS listener using the already observed Tailscale identity. It intentionally returns `403 DENY_UNENROLLED_COMMS_BRIDGE` to all normal requests and `503 HOLD_NO_AUTHENTICATED_PRIVATE_OPERATOR` to `/_ql352/transport`. **This is not a live, authenticated Comms Hub connection.** It does not send any application handshake, enroll an owner, create a database role, transmit a customer message, or turn on a device. The existing LAN Caddy server and its configuration are untouched.

The original QL-340B enrollment, independent issuer/witness checks, separate Ree and Jack owner decisions, DPAPI database credential and signed device TEST receipt are **still required**. The last observed database readback was zero enrolled original devices and zero signed TEST receipts, with all six sources `DISCONNECTED / HOLD`. Recheck independently before making any later live claim.

## Where we work

| Place | Navigation / machine | Work |
| --- | --- | --- |
| Comms Hub operator window | **I.T. → Connections → Connections · six apps → QL-350/QL-352 guide** | Read status and step-by-step help; a public disabled preview cannot start the private bridge. |
| Ree's original Windows mini-server | **DESKTOP-AE894KC**, PowerShell in `C:\Users\ree\rosevear-comms-hub-ql340` | All installation, validation, supervised start and stop actions. |
| Jack's separate Windows laptop | **Templar**, PowerShell in `C:\Users\jfros\rosevear-comms-hub-ql340` | Independent original-owner review and connection probes, never export private keys. |
| Tailscale Admin console | **Access controls → Tests / Policies / JSON editor** | Read and independently confirm the *existing* narrow grant; no blanket policy changes. |
| Other five app repositories | AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp | **No edits in QL-352.** Continue independent builds without overwriting them. |

## The two Caddy services must remain separate

| Existing LAN service (do not edit) | New supervised Tailscale service (QL-352) |
| --- | --- |
| Bind `192.168.68.74:8443` | Bind `100.77.246.3:8443` |
| Config `C:\Users\Ree\rosevearaihub\data\lan-access\Caddyfile` | Private staged config `%LOCALAPPDATA%\RosevearAIHub\CommsRelay\Gateway\ql352-tailnet.Caddyfile` |
| Existing Caddy `C:\Users\Ree\rosevearaihub\tools\caddy\caddy.exe` | Second, distinct foreground process using that existing executable |
| `tls internal` and upstream `127.0.0.1:8765` | Pinned *original* `comms-ql340b.crt` certificate plus independently verified matching local private key; **no proxy routes** |
| LAN client service, must remain available | Tailnet-only, authenticated operator *not yet implemented*, denies all connection actions |

The observed Tailscale certificate has subject `CN=desktop-ae894kc.tailc43957.ts.net`, issuer Let's Encrypt YE1, and original certificate-file SHA-256 `bc43943413b8ec4e0cc49c11405e2633f0176b9becc7f9ad924cc2417ae8048f`. This release pins the **original certificate file bytes** and checks certificate/private-key public-key equivalence. A later rotation requires fresh independent approval and a deliberate code update, **not** copying a replacement certificate into the path.

## Guided original Windows steps (Ree)

1. Open PowerShell under the original Ree Windows login. Update this checkout to the **already promoted clean** production `main` using the normal repository workflow, respecting any local changes. Confirm:

   ```powershell
   Set-Location C:\Users\ree\rosevear-comms-hub-ql340
   git status -sb
   git branch --show-current
   git rev-parse HEAD
   git rev-parse origin/main
   ```

   The branch must be `main`; `HEAD` must equal `origin/main`; the working tree must be clean. QL-352 itself must already be merged before continuing.

2. Read-only host and network check:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql352-windows-tailnet-gateway.ps1 -Status
   Get-NetTCPConnection -LocalAddress 192.168.68.74 -LocalPort 8443 -State Listen
   Get-NetIPAddress -IPAddress 100.77.246.3
   tailscale.exe status
   tailscale.exe serve status
   ```

   `originalHost` must be true. Existing LAN listener must remain present and Tailscale Serve must show **no Serve configuration**. Do not stop or reconfigure LAN Caddy, change the Tailscale admin grant, open an Internet-facing listener, or open the receiver on port `8788`.

3. Inspect the **existing** local certificate and key **filenames only** (never share key contents):

   ```powershell
   Get-ChildItem "$env:LOCALAPPDATA\RosevearAIHub\CommsRelay\TLS" -File |
       Select-Object Name, Length
   ```

   The script expects the original `comms-ql340b.crt` and a matching existing `.key` in this original user's private `TLS` directory. The default key name is `comms-ql340b.key`, which **has not been verified to exist**. If the original key is absent or encrypted in another format, **STOP on HOLD** and obtain the properly authorized original issuer/custodian resolution. Do not invent, export, or regenerate a key; never paste it into ChatGPT, GitHub, or Jack's laptop.

4. If and only if the required original key exists and both original owners have independently approved this *deny-all transport staging* (not TEST enrollment), stage it:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql352-windows-tailnet-gateway.ps1 -Stage
   ```

   For an **existing** private `.key` with a different filename, use `-TlsKeyPath "C:\Users\Ree\AppData\Local\RosevearAIHub\CommsRelay\TLS\ORIGINAL-KEY.key"` (replace only with the verified existing file). Type `STAGE_QL352_TAILNET_DENY_ALL` when prompted. This creates a new private config and provenance file without overwriting existing files. If a file already exists, STOP and independently review it; do not delete it to force restaging.

5. Validate without starting a listener:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql352-windows-tailnet-gateway.ps1 -Validate
   ```

   Require `ORIGINAL_TAILNET_DENY_ALL_GATEWAY_VALIDATED_NO_LISTENER` and no Tailscale listener yet. Validation checks exact config, checked-out source SHA, key match, LAN process identity, Tailscale status/Serve OFF, and Caddy's own parser. Failed checks are a genuine HOLD: do not bypass.

6. On **Jack's laptop**, open **Tailscale Admin → Access controls → Tests**. Verify the narrow existing policy assertion `jack-laptop` (`100.114.56.26`) → `ree-ai-hub` (`100.77.246.3`) TCP `8443` allowed, TCP `8788` denied. The JSON-editor **Preview rules** for the shared GitHub user can say “No ACL rules matched”; this is *not* a substitute for checking the host-based grant and test results. Don't save a widened policy to make the test pass.

7. Only when Ree explicitly supervises the private transport-only launch, use a **dedicated PowerShell** window on the original Windows server:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql352-windows-tailnet-gateway.ps1 -SupervisedStart
   ```

   Confirm by entering `START_QL352_TAILNET_HOLD_ONLY`. The separate Caddy runs in the foreground until stopped. It must **not** accept Comms requests, enroll the original owner, or touch existing customer data. Confirm LAN continues to respond separately.

8. On **Jack's laptop**, test only transport reachability:

   ```powershell
   Test-NetConnection -ComputerName desktop-ae894kc.tailc43957.ts.net -Port 8443 |
       Select-Object ComputerName, RemotePort, TcpTestSucceeded
   ```

   `TcpTestSucceeded=True` proves just TCP reachability. A browser/HTTPS status of **403 or 503** is a **correct HOLD**, not a failed real handshake. TLS validity and narrow Tailscale policy must be confirmed independently. A TCP failure still may be Windows Firewall or a source-policy mismatch; do **not** open broad ports or switch binding to `0.0.0.0`. Report the observed failure for an independently scoped owner decision.

9. Stop only the supervised QL-352 gateway using a **second PowerShell** window on Ree's server:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql352-windows-tailnet-gateway.ps1 -Stop
   ```

   Type `STOP_QL352_TAILNET_ONLY`. The script refuses an unexpected process identity, checks that Tailscale `8443` is OFF again and that the original LAN listener survived, and writes a stop-only witness to the private original evidence directory. It does **not** claim that the separately held receiver on `8788` was previously active or stopped. Re-run `-Status` and inspect the result.

## Remaining independent work before the first genuine signed TEST

- Original issuer/authentication evidence and chain review, original-host receiver-OFF witness, Ree's **source** custody decision and Jack's **master** custody decision, independently signed original QL-340B enrollment and approved public pins.
- Local private DB credential under owner custody, authorized database enrollment/readback, single approved original Windows receiver activation, authenticated server-managed private operator session, exactly one signed one-source TEST request and durable independent receipt verification.
- A later build must expose **only** the authenticated same-origin private operator service behind a separately reviewed route. QL-352's deny-all Caddy config **must not be edited manually** to forward requests.
- Each of the other five source applications gets its own authorization, limited TEST handshake, receipt and rollback. No release label `GREEN` makes a disconnected runtime source connected by itself.

## Confirming successful QL-352 *software release*

The `dev` and `main` branches must contain the same verified tree, PR build/test checks and main push/parity checks must be green, and the public Pages site must remain a disabled preview. The Windows original gateway is independently staged only by the real owners and will remain inactive if its key or independent approvals are absent. Release CI never uses a real private key.

## Source documentation

- [Caddy bind (per-interface listeners)](https://caddyserver.com/docs/caddyfile/directives/bind)
- [Caddy TLS (certificate/key files)](https://caddyserver.com/docs/caddyfile/directives/tls)
- [Caddy respond (intentional deny-all responses)](https://caddyserver.com/docs/caddyfile/directives/respond)
- [Tailscale network access controls](https://tailscale.com/kb/1337/acl-syntax)
