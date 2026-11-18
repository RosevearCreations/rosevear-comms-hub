# QL-472 — Read-only source consolidation and independently signed worker bootstrap PLAN

## Original host census provided by owner
DESKTOP-AE894KC (November 18, 2026):
C:\rc470 is clean main at b888959dab2b04fff8dfedacfcd8dfcd06c91640. Keep as current source.
Three older checkouts under C:\Users\Ree have local changes: rosevear-comms-hub, rosevear-comms-hub-current, rosevear-comms-hub-clean. Preserve and back up first.
The older rosevear-comms-hub-ql340 is clean, so it is only a potential archive candidate after owner review.
No running process, visible Windows service or scheduled task referenced any of these at the point of inspection. This does not exclude manual launchers or future invocation.
Owner read-only service checks report Rosevear-CommsHub NOT_INSTALLED, 8788 without listeners and old startup task DISABLED. These are not signed independent field attestations.

## Read-only command on DESKTOP-AE894KC
From a clean, up-to-date C:\rc470 on main run:

    powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\master-telemetry\ql472-original-host-consolidation-readonly.ps1 -Mode Inspect

The script calls the previous QL-471 census and shows ONLY numbers of tracked modified and untracked paths. No file contents, private paths from Git status, task commands or credentials are emitted. Zero deletion, file moves, service installs or receiver activation. Owner manually reviews backups and active references separately.

## Source-only bootstrap review
The QL-472 module checks a clean CURRENT five-folder census, a FRESH QL-471 owner host intake with missing worker, separately signed QL-468 original-host manual install PLAN, plus two ADDITIONAL distinct Ed25519 signers on a tightly scoped manual bootstrap plan. It binds census, snapshot, worker image, rollback assumptions, main source SHA, expiry and no-auto-install/start/send/cleanup/receiver activation.

Even a fully signed result is SIGNED_MANUAL_BOOTSTRAP_PLAN_REVIEW_HELD. It NEVER installs the Windows worker, grants execution, restarts Windows, enables a listener, rotates certificates, sends a peer receipt, or deletes a source copy. Real host witness and separate human-approved installation remain required.

Historical QL-468/470 evidence and QL-471 census cannot authorize a live installation by themselves. Synthetic CI test signatures are not actual original-host receipts.

## Release checks
Run node --test runtimes/master-telemetry/ql472-original-host-source-consolidation.test.mjs.
Append QL472 to QL336A mandatory app gates after QL471 and preserve unchanged original 43-gate fingerprint. Source files match on independent dev/main histories. Software production GREEN is distinct from original-host field HOLD.
