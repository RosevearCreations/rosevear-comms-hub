# QL-474: safe offline restored-file verification, independent first boot and seven-app source readiness

Original host status: prior owner QL-468/470 Windows probes report Rosevear-CommsHub service NOT_INSTALLED, no port 8788 listener, old task disabled. Most recent owner QL-472 census found three changed local clones with 2013/2159/2177 tracked changes and 17 untracked entries each. All three remain protected. No actual backups, offline restorations or enrolled host witnesses were supplied.

Features included:
1. Read-only Windows restored-file verification against three separately supplied ZIPs and isolated manual restores, using ZIP SHA-256, per-entry SHA-256, protected-source path exclusion, safe-path checking, size limits and no deletion. It does not create a backup or extract files.
2. Pure source review of exactly three ZIP readback groups, separately signed restore-owner / independent-witness packets, and separately signed first-boot owner / witness packets. All review results remain HOLD and do not authorize Windows service installation.
3. Exact seven source topology: AI Data Platform, Rosevear AI Hub and Comms Hub (three Masters) plus Yard Workers, iCamp, Rosie Dazzlers and Devil n Dove (four applications). Unknown metrics remain null, and no live connection/host reboot is invented.
4. Required QL-474 CI gate following QL-473. The original 43 app gate fingerprint is preserved.

Manual steps, NOT run by this build:
- Create three complete backups including untracked files on the owner server. Store backups offline, separately verify coverage, and manually extract to safe isolated destinations, not inside the five source clones.
- Supply locally trusted manifest with schema rosevear.comms.ql474.restore-manifest.v1 and archives array of exactly three records with sourceName, zipPath, restoredRoot, zipSha256. NEVER store manifest or ZIP contents in GitHub.
- After independently preparing real local paths, inspect original host with:
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql474-offline-restore-readonly.ps1 -Mode Inspect -ManifestPath C:\private\ql474-restore-manifest.json
- Do not remove even the clean ql340 clone without a separately documented decision.
- An authorized original-host Windows worker installer, real independent original-host observation, supervised first boot and nonpersonal read-only single-peer ACK are future field acceptance; a GitHub CI run cannot perform or prove these.
- The existing Build 423 loopback-only signed telemetry producer remains a separate source-only capability. Transport authentication, source signer enrollment, and real seven-app metrics are future field gates.

A GREEN source deployment does NOT imply green original-host service or real seven-app communication. Future acceptance builds should deliver meaningful 5–10 percentage point progress against the weighted COMMS scorecard, with actual evidence, not artificially change percentages.
