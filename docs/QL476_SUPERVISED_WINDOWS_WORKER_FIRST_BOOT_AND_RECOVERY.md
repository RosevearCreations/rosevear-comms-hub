# QL-476 — supervised original Windows host worker, first run and recovery

This build introduces a real on-demand Windows Task Scheduler worker for limited local system-operation measurements. It records the current source revision, run ID, OS boot ID, uptime and process count to an owner-local directory. There is no scheduled trigger, boot persistence, listening socket, peer transmission, service registration or machine reboot. The existing three historical source clones and the QL340 archive candidate must remain untouched.

Important distinction: a Windows Scheduled Task is not an SCM service. The QL-476 worker is deliberately on-demand. It is not the live seven-source gateway, and source CI cannot install anything on the original host. QL-475 separately requires verified disconnected backup and independently observed full restore before using the install mode. The owner must retain those records outside GitHub; do not commit any private receipts, addresses, credentials or keys.

After QL-476 is merged to main, only on DESKTOP-AE894KC, using the already verified clean C:\rc470 checkout, inspect:

    git -C C:\rc470 pull --ff-only origin main
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql476-original-host-worker.ps1 -Mode Inspect

Only after original-host backup and independent offline restore evidence has actually been checked by a person, explicitly install the on-demand task in an interactive owner session:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql476-original-host-worker.ps1 -Mode Install -ApproveInstall -OfflineRestoreIndependentlyWitnessed

Run and inspect the first local worker result:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql476-original-host-worker.ps1 -Mode Start -ApproveFirstRun
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql476-original-host-worker.ps1 -Mode Verify

A separately approved non-reboot recovery drill is available:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql476-original-host-worker.ps1 -Mode Recover -ApproveRecovery

The receiver on 8788 must remain OFF, and previous startup tasks disabled; the script refuses unexpected enabled legacy tasks and changes. The worker writes local evidence only to %LOCALAPPDATA%\RosevearCommsHub\QL476, using unique run IDs. Restrict access to that user and keep the directory out of synchronized/public folders. Never use this script in unattended boot tasks.

Acceptance still requires two different real Ed25519 keys, owner and independent observer, matching the same source SHA, worker hash and two different run IDs on the original host. The pure source assessor intentionally reports REVIEW_HELD even when synthetic cryptographic tests pass. This is not evidence of live receiver enrollment, supervised reboot, physical host recovery or production transport. Existing offline archives and five source directories are never automatically removed.

Source promotion can be GREEN if checks and Cloudflare deployment succeed; physical installation, first run, independent witness, network activation and recovery acceptance remain HOLD until independently corroborated.
