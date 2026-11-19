# QL-477 — Original-host installation evidence, independent recovery and secure first telemetry

QL-477 **ships an owner-operated, local-only evidence export and pure cryptographic review pipeline**, not an unattended worker activation. The original Windows host is DESKTOP-AE894KC, primary checkout C:\rc470. The QL-476 Windows Task Scheduler worker must already have been separately installed with explicit owner approval, on-demand (zero triggers), and run at least twice without an OS reboot. The worker does not auto-start, listen, reboot, run on CI or call any cloud endpoint.

## What is implemented
- Exact Task Scheduler executable/arguments, interactive owner, last-task exit, original source revision and worker-image hash checked before accepting any local evidence.
- Two distinct on-demand receipts with same boot fingerprint and increasing timestamp, each file separately SHA-256 hashed.
- Current port 8788 listener, legacy task and auto-start Windows service inspection; everything must be OFF.
- Strictly allowlisted *non-sensitive aggregate* SysOp sample (uptime and running-process count). No device tokens, usernames, filesystem contents, customer details, inbox data or raw logs in telemetry.
- Offline JSON exported into the original owner's %LOCALAPPDATA%\RosevearCommsHub\QL477 directory, never the repository; unique filename and no overwrites. No telemetry is sent by this script.
- Pure evidence reviewer refuses stale, malformed, replayed, relabeled or unsafe receipts. Two independent pinned Ed25519 signatures can corroborate an owner and physical observer claim; success remains REVIEW_HELD without independent field acceptance.
- Separate signed telemetry and signed read-only ACK packet review uses distinct pins, exact sample SHA-256, bounded TTL, durable readback claim and replay guard; no live mTLS or cloud receipt is fabricated.

## Original host procedures (after GitHub main promotion)
First preserve old checkouts and confirm the QL-475 disconnected backup and independently witnessed full restore. On the original Windows host only, maintain a clean main checkout. Run:

    git -C C:\rc470 pull --ff-only origin main
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql477-original-host-evidence.ps1 -Mode Inspect

The script returns a HOLD if no QL-476 task or evidence exists. If QL-476 has not been installed, do **not** turn this into an unattended step. Follow the separate QL-476 owner installation and manually approved first/recovery steps after the offline backup witness has been obtained.

Only when a real original-host owner is supervising the evidence collection:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\rc470\runtimes\master-telemetry\ql477-original-host-evidence.ps1 -Mode Export -ApproveLocalExport

The export file remains local/private and must be reviewed using independent physical witness and distinct real pre-pinned keys, not the synthetic CI signers. Avoid uploading private evidence to public GitHub, chat, websites, logs or public issues.

## Release and physical status are separate
- **Source production GREEN** requires merged main, successful app/Windows CI, public asset parity and a Cloudflare production Workers build.
- **Original-host installation** is HOLD unless physically witnessed from the correct host, with matching task, source and file hash.
- **Recovery certificate** is HOLD until a separate human independently observes two runs and confirms the real offline restore plus preserved source copies.
- **First secure telemetry accepted** is HOLD until the production transport, actual pinned original-host signature, independent authenticated receiver and durable first ACK are independently verified. Code passing unit tests does not prove this.
- No inherited authority to delete source directories, enable peer sends, activate receivers, schedule reboots or start Windows services. 

Maturity percentages must not increase merely because mocked CI fields report success; recalculate only when features are independently working in the intended operational environment. QL-477 does not remove any of the exact 43 legacy QL336A gates.
