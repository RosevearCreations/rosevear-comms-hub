# QL-475 original-host protected archive staging, full isolated restore and independent witness

Last owner-supplied evidence: C:\rc470 clean main; three historical Comms Hub clones have 2013, 2159 and 2177 tracked change entries and 17 untracked entries each. QL340 clone is an archive candidate only. Windows service Rosevear-CommsHub was NOT_INSTALLED, port 8788 without listeners and the legacy startup task disabled.

The new QL-475 Windows script supports Inspect (default and read-only) and Stage (requires explicit ApproveLocalStage). On the original Windows host ONLY, Stage may create three separate ZIP archives containing all regular files, including hidden and untracked, in an owner-selected staging root outside every old repository. It also creates separate isolated restoration folders and checks every restored file by SHA-256. It records stage counts, backup digests and full file-tree digests without emitting file names or contents. No existing backup is overwritten and no source directory is modified. It does not delete files, install services, reboot or send network events.

These are LOCAL staging operations, not automatically OFFLINE backups. To achieve true offline acceptance, the owner must retain a verified copy on disconnected storage and obtain an independently witnessed full restore and genuine Ed25519 source-owner signatures. Synthetic CI signatures only test reviewers and cannot attest physical host facts. Signed source reviews remain HELD and do not authorize cleanup.

Inspect after main promotion and a CLEAN C:\rc470:

    Set-Location C:\rc470
    git status --short
    git pull --ff-only origin main
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql475-three-archive-original-host.ps1 -Mode Inspect

A local staging command is available ONLY if the owner has prepared distinct, nonoverlapping destination parent directories. The example drive letter below is illustrative and may not exist:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql475-three-archive-original-host.ps1 -Mode Stage -ApproveLocalStage -BackupRoot "E:\RosevearCommsBackups" -RestoreRoot "E:\RosevearRestoreTest"

The script must not run Stage in unattended startup tasks; a person must first confirm the destination drive and free disk capacity. It will not move or delete original source folders. Keep the clean ql340 clone until separate owner archive disposition.

QL475 is a substantial source implementation and safety improvement. The previous estimated weighted software maturity stays unchanged until genuine host restore/witness acceptance can be provided; a 5 to 10 percentage-point product score increase cannot be claimed from synthetic tests alone. QL-475 is appended to required QL336A safety tests after QL474, without changing the legacy exact 43 gates.
