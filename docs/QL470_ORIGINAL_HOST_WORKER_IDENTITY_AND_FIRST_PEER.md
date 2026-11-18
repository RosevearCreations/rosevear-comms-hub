# QL-470 — Original Windows evidence, verified worker review, supervised first peer (field HOLD)

## Why this build exists
The owner ran the QL-468 script in two local folders and received "the argument to -File does not exist". This means the specified script was absent in each local directory. Neither failure proves the Windows worker is installed, missing or damaged. The latest GitHub main contains the source; old local repositories do not necessarily have it.

## Recover safely on DESKTOP-AE894KC
From a PowerShell prompt under C:\Users\ree, locate existing copies without changing them:

    Get-ChildItem -Path 'C:\Users\ree\rosevear-comms-hub*' -Filter 'ql468-original-host-readonly.ps1' -Recurse -File -ErrorAction SilentlyContinue | Select-Object FullName

For each local checkout use git -C <folder> status --short, git -C <folder> remote -v, and git -C <folder> branch --show-current before changing anything. Do not blindly git pull, git reset --hard, delete local folders, change services or expose credentials. The owner can retrieve an up-to-date clean source copy from the verified repository URL using a normal Git clone into a NEW empty folder. That does not run the worker or modify the existing service.

QL-468 read-only inventory command, from the fresh local repository root:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql468-original-host-readonly.ps1 -Mode Inspect

QL-470 expanded read-only inventory command:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql470-original-host-evidence-readonly.ps1 -Mode Inspect

The QL-470 script checks original host, service start state and SCM account, hashes the service EXE if safely accessible, inspects disabled legacy task and local 8788 listeners, and prints compact JSON. It will not export the raw service command line, which may carry secrets. An EXE digest of a wrapper such as node.exe does NOT by itself establish the integrity of the application being hosted. Neither script signs claims or authorizes activation.

## Source-only verification

QL-470 verifies two strict independent evidence contracts:
- Original worker inventory bound to an Ed25519 host claim and a DIFFERENT independent identity witness, SHA-256 inventory and service image, signed main SHA, boot ID, timestamps, receiver OFF and precise service identity.
- First peer receipt re-verifies QL-469 enrollment, QL-467 signed nonpersonal read-only event/ACK, QL-468 independent ACK audit, QL-469 independent peer signature, and additionally requires distinct explicit owner and human witness signatures on the same first ACK, client TLS leaf and boot.

No data is submitted, listener enabled, reboot authorized, certificate rotated or live service started by this build. A valid signature demonstrates consistency, not that a reviewer genuinely witnessed Windows or network behavior. All positive source results are SIGNED_*_REVIEW_HELD. Synthetic integration tests MUST NOT be treated as first-live-peer acceptance.

Original-host worker identity, physical enrollment and first live peer remain HOLD until the owner separately performs a supervised authorized field procedure and an independent party verifies the actual observations. Never commit original device secrets, private keys, receipts with personal data, or raw service command lines.

## Source release gates
Run:

    node --test runtimes/master-telemetry/ql470-original-host-field-assurance.test.mjs

Mandatory QL-336A chain includes this new gate after QL-469 while preserving the exact original 43-gate fingerprint. main/development have independent history; source files are mirrored, not bulk merged. Software GREEN is not physical host acceptance GREEN.
