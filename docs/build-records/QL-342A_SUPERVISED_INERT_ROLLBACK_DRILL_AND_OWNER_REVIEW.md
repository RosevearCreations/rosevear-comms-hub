# QL-342A — Supervised Inert Rollback Drill & Independent Witness Review

## Purpose and limits

This is an **isolated, locally supervised safety rehearsal**, never a real receiver stop or a source-authorized TEST connection. The Windows operator verifies the real receiver port **8788 is not listening**, checks that Tailscale Serve is off and no database credential is loaded, then asks for explicit typed consent. A separate Node child opens one OS-assigned port on **127.0.0.1 only**, answers a random challenge, is stopped by the parent and has its local port closure confirmed. Nothing connects to a remote app, customer system, database or device.

The durable file is a **self-reported local execution record**, structurally checked but **not cryptographically attested by an independent original-owner witness**. It never establishes that the actual receiver was stopped. Existing original-owner signatures, independent public pin approvals, private receiver DB credentials and exactly one signed immutable TEST receipt remain required under QL-340B/C, QL-341 and QL-342.

## Ree's supervised Windows field steps

1. On `DESKTOP-AE894KC`, work from the existing checkout, stop if `git status -sb` shows local changes, then fast-forward the released `main`:

   ```powershell
   cd C:\Users\ree\rosevear-comms-hub-ql340
   git status -sb
   git pull --ff-only origin main
   ```

2. Confirm no process listens on 8788 and Tailscale Serve remains off:

   ```powershell
   Get-NetTCPConnection -LocalPort 8788 -State Listen -ErrorAction SilentlyContinue
   tailscale.exe serve status
   ```

3. Run the inert drill **in an interactive PowerShell window on Ree's actual PC**:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -RollbackDrill
   ```

   Type **`RUN_INERT_LOOPBACK_DRILL`** when prompted. Any failed preflight or refusal keeps the receiver OFF and produces no approved witness. The user controls this local operation; CI or the hosted app cannot execute the on-host rehearsal.

4. The operator writes a new, non-overwriting private file matching `Evidence\ql342a-inert-rollback-drill-*.json` under `%LOCALAPPDATA%\RosevearAIHub\CommsRelay`. Share **only nonsecret state/metadata**, not database credentials, private keys or enrollment packets. Validate the shape with:

   ```powershell
   node .\runtimes\hub-relay\ql342a-rollback-drill.mjs --inspect "$env:LOCALAPPDATA\RosevearAIHub\CommsRelay\Evidence\<actual-drill-filename>.json"
   ```

   Replace `<actual-drill-filename>` with the exact filename printed by the operator. `--inspect` accepts the format only; it does not verify an independent witness.

5. Ree and Jack independently review the recording and original system state before any further enrollment ceremony. The drill may be referenced as **inert rollback readiness evidence** among the four source review inputs, but must **never be relabelled** as a real `ql340c.stop-witness.v1` or as independent owner authorization. An actual receiver stop requires its own separate, witnessed field procedure when one is safely available.

## Verification and release controls

- Negative tests reject fabricated receiver stop, non-loopback binding, use of port 8788, database reads, forged connection flags and future-dated entries.
- CI exercises the inert subprocess on Linux and Windows with no credentials and no real Tailscale modifications.
- Existing Windows `-Status`, `-SelfTest`, `-OwnerPreflight`, owner decisions and all 43 required pre-existing application gates are preserved.
- QL-342 owner decision surfaces inert drill presence separately, with `actualReceiverStopDocumentPresent` remaining false for a drill and `approved:false` for every review.
- No schema migration, private role grant, scheduled task, networking permission, live dispatch, SMS or customer/device action is introduced.

**Safe state after code release:** production source may be GREEN, while the local drill is *not run until the owner chooses to run it*, original owner enrollment stays HOLD, the real receiver stays OFF and all six private peers remain unconnected.
