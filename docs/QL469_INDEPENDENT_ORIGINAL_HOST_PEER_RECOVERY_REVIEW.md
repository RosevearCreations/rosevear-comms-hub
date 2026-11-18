# QL-469 — Original-host independent evidence and recovery (source release, field HOLD)

This release provides three narrowly scoped read-only reviews:

1. **Original worker**: join the QL-468 unsigned Windows inventory to distinct original host, owner and independent witness Ed25519 signatures. Require genuine service inventory, Manual start, running worker, disabled obsolete startup task and no 8788 listener.
2. **Verified signed peer receipt evidence**: require the QL-468 actual signed event/ACK/audit correlation plus a fourth independently pinned peer reviewer key, exact TLS leaf fingerprint, exact receipt digest, verified receipt replay claim and source main commit.
3. **Recovery**: review host-signed before/after worker states and an independently signed reviewer digest on the same boot, without enabling any automatic recovery or reboot.

Positive code results are named SIGNED_*_REVIEW_HELD, **not** original-host field acceptance. The QL-468 command emits unsigned inventory, so even cryptographically consistent packets cannot establish physical provenance or live mTLS. Host install, live transport, source-controlled recovery and certificate cutover remain **HOLD** without separately authorized on-device procedures and independently collected field evidence. QL-340C private receiver remains OFF/UNKNOWN. No original device is remotely accessed by this change.

Safe read-only inventory, run locally on DESKTOP-AE894KC from the repository root:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql468-original-host-readonly.ps1 -Mode Inspect

Store genuine evidence away from Git, without customer information or private keys. Never substitute a CI sample or synthetic signatures for independent original host evidence.

Test: node --test runtimes/master-telemetry/ql469-independent-original-host-acceptance.test.mjs

The test runs in the existing required QL-336A chain. Promote matching narrow changes independently to dev and main (branches have divergent histories), not by a bulk dev/main merge. GitHub/Cloudflare GREEN reports software deployment only.
