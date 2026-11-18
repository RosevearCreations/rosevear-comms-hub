# QL-471 — Original host evidence intake, independent witnesses and owner-gated one-peer plan

## Grounded original-host snapshot (owner-provided, **unsigned**)
The owner ran QL-468 and QL-470 on DESKTOP-AE894KC from C:\rc470, a new clone. Observations were 2026-11-18T02:10:10.8419166Z (QL-468) and 2026-11-18T02:10:32.8265650Z (QL-470). Both report Rosevear-CommsHub workerPresent=false, workerState=NOT_INSTALLED, workerStartMode=NOT_INSTALLED, planned service account mismatch, port 8788 listener count 0, legacy task disabled. These are pasted read-only local results, NOT Ed25519 signed owner or independent host-witness evidence. The receiver being OFF is NOT independently verified by these scripts. This build MUST NOT advertise original-host worker enrollment, physically witnessed identity or first live ACK success.

## Repository copies
The original machine has C:\Users\ree\rosevear-comms-hub, -clean, -current and -ql340, and a new inspected C:\rc470. Their names and timestamps do not prove runtime use. DO NOT delete any until on-host inspection establishes Git HEAD/status, active SCM service paths, scheduled-task actions, process references, backup and human confirmation of whether untracked files matter.

Read-only checkout census on original host, from a fresh main clone:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql471-original-host-checkout-census.ps1 -Mode Inspect

The census does NOT modify Git folders, install services, change task state or print raw command lines. It conservatively marks all locations deletion-unapproved. Service/task/process argument strings are inspected only for local path presence and are NOT emitted. One command is only a point-in-time observation and may miss future scheduled/manual script invocation. Do not remove old copies automatically. It is also possible the separate AI Hub host folder remains active and is outside this Comms-specific census.

## Source-readiness validation
QL-471 added a bounded JSON intake for the exact QL-468/470 schemas, consistent host/service/state/timestamps, receiver-port, legacy-task and no-action guards. Produces hash-linked, source-SHA-bound review receipts without attaching credentials or service commands. Stale snapshots are historical, never current readiness.

Owner and independently pinned Ed25519 witness packets must include matching snapshot digest, source SHA, matching original host, strict freshness, distinct signature keys, scoped approval and no-install/no-auto-send/no-reboot/no-receiver-enable. Genuine signing is NOT performed by the CI tests or script; the actual source receipts remain unsigned until a qualified independent reviewer participates.

An eligible single-peer **plan** still requires an installed worker and QL-470 independently signed worker-identity evidence. Even then its state is OWNER_GATED_SINGLE_PEER_PLAN_REVIEW_HELD, not live transmission authority. Automatic install, send, restart, service task changes and first peer activation are deliberately unsupported.

## Suggested safe sequence
1. Owner reviews read-only checkout census; keep existing copies and back up untracked files.
2. Owner uses a known-clean main clone for inspection; do not install blindly or overwrite legacy Windows service.
3. Obtain a separately authorized installation/supervision procedure with narrow Windows account and key custody.
4. Rerun QL-468 and QL-470 on original machine AFTER actual authorized installation (not part of QL-471).
5. Collect real signatures from independent owner and reviewer, then separately decide on one nonpersonal read-only peer pilot. No activation by CI.

## Gates
Run: node --test runtimes/master-telemetry/ql471-original-host-evidence-intake.test.mjs

QL-336A invokes it after QL-470 and retains the original 43-gate fingerprint. main and dev are mirrored at the source level, not bulk-merged. Software GREEN does NOT mean the original-host service is present or any peer pilot has happened.
