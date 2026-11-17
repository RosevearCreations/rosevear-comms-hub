# QL-466 — Vault / KMS secrets lifecycle, dual-issuer rotation and AI Hub 355 host handoff

**Code release scope:** Rosevear Comms Hub ONLY. Preserve independent deployments and backward-compatible 1.0/1.1 read-only envelopes. This document is a **source-traceable readiness finding**, NOT an attestation that DESKTOP-AE894KC has any Comms service installed or that a private peer accepted an event. No reboot, live receiver or credential operation is authorized.

## Independent source findings, 17 November 2026

1. AI Hub [Build 355 / QL-464 source PR #804](https://github.com/RosevearCreations/rosevear-ai-hub/pull/804), [host readiness document](https://github.com/RosevearCreations/rosevear-ai-hub/blob/main/docs/BUILD_355_QL464_HOST_STARTUP_MASTER_READINESS.md) and \`scripts/inspect-master-startup355.ps1\` list \`Rosevear-CommsHub\` as a logical intended Windows SCM service, **not an independently installed or autostart-confirmed process**. AI Hub preflight checks SCM and service/task presence read-only but its inventory is unsigned and **not physical boot proof**. No Comms-owned signed Windows worker installation package, independently countersigned activation/autostart ceremony or live worker service readback is established in this repository: **worker install and signed autostart protocol = NOT IMPLEMENTED / UNVERIFIED**. Cloudflare static Worker hosting is not an installed Windows SCM worker.
2. Existing [QL-340C private receiver contract](../build-records/QL-340C_PRIVATE_RECEIVER_CREDENTIAL_VAULT_AND_SUPERVISED_STARTUP.md) and \`runtimes/hub-relay/ql340c-windows-operator.ps1\` explicitly require a separately authorized, short-lived dual-original-owner signed TEST enrollment; a purpose-limited dedicated DB identity; current-user DPAPI credential storage; private certificate and Tailscale Serve OFF; original host exact device/workload; typed \`START_TEST_RECEIVER\`; **foreground supervised loopback 127.0.0.1:8788 only**. The start action is NEVER a Task Scheduler/SCM worker installation. It is not a background receiver and MUST NOT be placed in any startup task. \`Rosevear AI Server Startup\` is obsolete; do not revive or recreate it. Receiver OFF is **NOT independently witnessed** here and must display **OFF/UNKNOWN (HOLD)** until genuine field evidence.
3. A source search of Comms default \`main\` found **no exact \`POST /internal/rosevear/master/events/read-only/v1\` route/handler**. Status: **NOT IMPLEMENTED** (not merely paused). QL-461/462/463 source-only protocol/ledger tests are NOT an HTTP receiver. Accordingly, no real deployed Comms peer mTLS receiver certificate proof, pinned Ed25519 sender issuer, durable receiver-side ACK or independent original-owner/audit reconciliation can be certified: **UNVERIFIED / HOLD**. Hub's historical signed-sink expectations in Build 354 are requirements, not proof Comms implemented them.
4. Original-host startup, Comms Windows worker, private QL-340C receiver, and external static Worker deployment are **four different lifecycle boundaries**. Do not autostart \`ql340c-windows-operator.ps1 -Start\`; do not change Tailscale, certificate/private signing material, Supabase/database credentials or production service state in this handoff.

## QL-466 implemented code

\`runtimes/master-telemetry/ql466-vault-rotation-host-readiness.mjs\` validates narrowly scoped, externally Ed25519-signed **managed Vault/KMS inventory claims** with opaque handles, purpose/expiry restrictions and no client/raw-key access. Both independent owner and custodian must sign the exact same candidate rotation plan using **distinct** pinned Ed25519 public keys. Verify old/new managed handles and versions, 1–24h overlap, prior/candidate certificate fingerprints, candidate expiry beyond overlap and old-key validity, original \`main\` source SHA, fresh 1h-limited consent, and explicit \`automaticActivation=false\`. Staged proof is **REVIEW HELD**, never automatic cutover, actual Vault root-key access, certificate change or old issuer retirement.

A separately signed original-host worker observation and independently signed owner/auditor digest can be validated only when supplied by the original source. Neither a source mock nor an inventory claiming RUNNING is a witnessed physical reboot. The sink readiness decision is **unconditionally HOLD** until an actual endpoint and independent transport/ACK attestations exist. Keys, credentials and source-controlled fixtures are NEVER used as original authority. The existing QL-332 managed-custody broker and QL-465 AES-GCM PII module remain distinct: this is a verification layer, not a provisioned production KMS/Vault adapter.

## Exact proposed owner-approval protocol: NOT YET IMPLEMENTED as an installer

Before designing or authorizing any \`Rosevear-CommsHub\` SCM autostart, the owner and independent custodian must approve a versioned contract identifying exact signed release \`main\` SHA, artifact digest, expected service executable/SCM image path hash, service identity and least-privilege account, private storage ACLs, dependency order, Windows startup/recovery configuration, no receiver \`-Start\`, cert/issuer fingerprint and expiry windows, roll-forward/revert sequence, signed re-entry criteria, observability and teardown. The installation and rollback must be implemented as separate, **explicitly approved** host-local code; QL-466 does not install either.

Before a supervised **real reboot** collect genuine independent evidence:

- **Signed services/worker inventory:** fresh original-host signed SCM/task inventory, exact process/executable and startup mode, installed service account and recovery policy; independent owner/custodian reviewer countersignature bound to a physical boot ID. A static task definition, a loopback listener, source file or CI test is not a signed boot/run receipt.
- **Release and rollback plan:** signed exact install source/artifact hash, owner-approved dependencies, pre/post health checks, a no-reboot dry-run plan, explicit rollback that does not delete audit custody or enable the private receiver.
- **Peer sink contract:** implement and deploy exact \`POST /internal/rosevear/master/events/read-only/v1\` only after independent design review: verify owner-pinned mTLS client certificate, sender Ed25519 issuer key fingerprint, source/tenant/workspace binding, nonce/expiry, idempotent encrypted/no-PII outbox, source-only rights, durable append-only receiver audit, independently signed \`RECEIVED\` ACK and source owner-audit correlation. **At QL-466 the route is NOT IMPLEMENTED.**
- **Expiry-safe cert/key rotation:** separately signed original owner and security custodian plan, 1–24h overlap bounded by **both** certificate/key expiry times, candidate mTLS proof with actual peer leaf pin and issuer, fresh signed ACK before cutover; previous issuer cannot retire until independently proven successful; no unattended root key/cert rotation.
- **Observed local state:** actual DESKTOP-AE894KC post-reboot SCM service readback and independently signed boot/run witness; fresh peer mTLS + Ed25519 + durable ACK and owner audit, separate negative TEST receiver state witness. **No current direct host observation was made.**

**Final gate:** absent ANY of these items => \`REBOOT=HOLD\`, \`SOURCE_SINK=NOT_IMPLEMENTED\`, \`WORKER=UNVERIFIED\`, \`PRIVATE_RECEIVER=OFF/UNKNOWN\`, \`LIVE=HOLD\`. Never manufacture, waive or simulate a signed ceremony.

## Read-only original-host commands (only when owner wants to inspect)

Use the accepted original Windows checkout of **rosevear-ai-hub**, without changing task or service configuration:

\`\`\`powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\inspect-master-startup355.ps1
\`\`\`

For the Comms repository, **read-only only**, and in an updated trusted local checkout:

\`\`\`powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\runtimes\hub-relay\ql340c-windows-operator.ps1 -Status
\`\`\`

Those commands output an UNSIGNED local snapshot, not independent attestation, and do not authorize a reboot. Do not ask anyone to run \`-Start\`, activate the worker, change networking or edit credentials as part of this handoff.

## CI / production gates

\`node --test runtimes/master-telemetry/ql466-vault-rotation-host-readiness.test.mjs\` tests signed provider claim, separate pins and approvals, old/new overlap expiry, original worker identity, tampering, tenant/scope denial, and missing endpoint fail-closed behaviour. App Vitest checks the honest HOLD UI. The 43 original QL-336A topology-fingerprint checks remain unchanged; the new QL-466 gate is separately asserted. Before calling **source** production GREEN, require both scoped \`dev\` and protected \`main\` PRs merged, exact-main app/build + protected audit + Windows safety, successful Cloudflare production build, and public Worker JS/CSS parity to exact merged SHA. **No runtime, Windows, Vault or legal/privacy acceptance is inferred from those checks.**

Next proposed release after QL-466: **QL-467 — Authenticated Read-Only Master Event Sink Implementation, Original-Host Worker Enrollment & Independently Witnessed Boot/ACK Pilot**, dependent on actual separately approved host/source access.
