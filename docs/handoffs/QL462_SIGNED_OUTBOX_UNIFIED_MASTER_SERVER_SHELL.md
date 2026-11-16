# Rosevear Comms Hub QL-462 — Signed Source Outbox/Inbox, Idempotency and Unified Master Server Shell

## Production intent and scope

QL-462 builds two independent, compatible foundations **inside Comms Hub**: a signed, private, durable outbox/inbox *receipt-review library*, and a functioning **session-local unified Master UI preview** with three independent module visibility controls, theme switching, and status views for the two SaaS slave shells.

These are not the full three-repository convergence or a running 24/7 Windows service. Do not misread UI switches as original-host physical command authorization, signed source messages as live-delivered events, test fixtures as operational telemetry, or Comms Cloudflare GREEN as Vercel/Windows host GREEN. The original DESKTOP-AE894KC private receiver remains OPEN/HOLD with no proof of current physical OFF and no activation/closure permission.

## Contract for the three Masters to feel like one application

**Entry shell / controller:** AI Data Platform should ultimately own the navigable top-level Master Server Shell. Separate compatible modules:
1. **AI Data Platform** — intelligence, telemetry registry, verification, forecasting and global shell.
2. **Rosevear AI Hub** — Windows DESKTOP-AE894KC local orchestration and agent runtime, Home Assistant, Mosquitto MQTT, Ollama, Caddy HTTPS and Tailscale.
3. **Rosevear Comms Hub** — signed cross-app communication and human operator incident/inbox delivery.

Each module can be *logically opted out* independently **after** an independently authorized service-management implementation exists on the original host. QL-462 implements **safe session-only display visibility** toggles now, rather than unsafe service STOP/START requests from a Cloudflare UI. No feature flag in this release can start or stop a Windows service or authorize a physical receiver. Each module remains independently deployable by protocol compatibility, with no lockstep on the three Master repos.

**Themes** in the Comms preview: Master Instrument, Nebula Purple, Meadow and High Contrast, with colour/background gradients. Later image-based themes require individually approved/local hosted image assets and contrast tests. The live AI Data Platform top-level shell, AI Hub and Comms UI should eventually use one owner-selected theme token contract, while iCamp and YW keep their separate application designs. Existing Comms operator screens continue to work and only show the preview when viewing Dashboard, IT Command or System Status.

## Monitoring YW, iCamp and home automation

The preview panels identify YW and iCamp as **SLAVE APPLICATION SHELLS** and show **LIVE HEALTH UNVERIFIED**, not invented performance metrics, outage warnings, throughput figures or availability. Actual metrics must later come from independently authenticated, tenant-safe, freshness-bounded telemetry; fallback on source outage is HOLD/stale, never synthetic healthy. Home Assistant/MQTT/Ollama remain **NOT CONNECTED** from this release. A private always-on Windows supervisor will require authenticated boot/task startup, privilege isolation, key rotation, service watchdogs, backups, reboot recovery and signed exception alarms, with the original host receiver separately owner-gated; no automation is installed or running by this GitHub/Cloudflare change.

## QL-462 durable signed read-only message review

Node-side only: `runtimes/master-telemetry/ql462-signed-outbox-inbox.mjs`. This module does not run inside the public Cloudflare Worker and must never be wired to an unauthenticated network endpoint.

- Enforces protocol **1.1** with supported **1.0** known capabilities under AI Data Platform Build 408; no major-version auto-upgrade and no seven-app lockstep release. Vercel-limited iCamp, YW or AI Data Platform never block unrelated local operations. A capability unavailable on a peer remains HOLD.
- Requires pre-pinned Ed25519 source signature bound to source repository, exact SHA, fixed Master audience, nonpersonal body SHA-256 digest (never a raw body), approved source and tenant/workspace, finite expiry ≤5 minutes, one-way `SOURCE_READ_ONLY` and no owner ceremony, secrets, database write or authority transfer.
- **QL-461 authorization is re-evaluated** from its signed 42-policy matrix and independently signed source/tenant/consent proof at staging time; matching source/audience/capability/protocol/tenant/workspace/pin and scope are required, not a caller-provided `authorized=true` boolean. No new privileges can arise from consent or delegation.
- Private Node ledger requires an absolute 0700 directory, writes exclusive 0600 files with fsync and directory fsync, checks record integrity, refuses symlink/open-to-write misuse; **idempotency key** identifies one canonical outbox record. Byte-identical retries return the existing receipt, conflicting new messages return HOLD. Separate signed ACK and signed owner-approved dead-letter receipts are one-use and mutually exclusive; no synthetic delivery successes.
- Master-signed ACK must match exact original message/idempotency/protocol/outbox hash, be fresh, and declare `runtimeConnection=UNVERIFIED_HOLD`. Result is `SIGNED_MASTER_ACK_REVIEW_ONLY`, **not LIVE DELIVERED**. Even dead-letter evidence remains OPEN/HOLD.
- Peer status is a caller observation for the local staging decision, not a remote connection check; a disconnected peer can produce `SIGNED_OUTBOX_PENDING_HOLD` without dispatching. Actual delivery needs a separately installed, authenticated transport, bounded retries and cross-process nonce/JTI reconciliation, independent source consent, and matching private peer-ack readback.
- Local owner-approved work can continue independently of a cross-app queue. No code in Comms QL-462 edits or deploys iCamp/YW/AI Data Platform, nor the other peers.

## Protected acceptance and operational safety

Tests: `node --test runtimes/master-telemetry/ql462-signed-outbox-inbox.test.mjs`, previous protected QL-417–461 tests, existing QL-336A app release gates and QL-340 original Windows owner-key safety. Negative cases include malformed signatures, wrong repository/main SHA, T5/owner-ceremony attempts, cross-app private data, mismatch against QL-461 authorization, replay/nonces/idempotency conflicts, signed ACK and owner dead-letter forgery, private file tampering, protocol 1.0/1.1 compatibility and peer outage with local continuity. TypeScript/Vite compilation must verify the three-module preview.

**Release check**: deploy only in Comms `dev` then scoped four-plus-file `main`; verify final `main` SHA, protected tests, full app build, Windows safety, Supabase, Cloudflare Worker Production and public JS/CSS SHA-256 parity. Keep only `dev` and `main` as *long-term* branches; GitHub connected tools may not support deleting temporary branches. No branch deletion can be assumed from merging PRs.

## Rollout roadmap (future separate builds)

- **QL-463**: Reconciled signed event-causality, replay-independent custody proof and owner-safe exactly-once effect gating. Add an actual transport adapter only after independent host approval and route authentication, not by simulating sent messages.
- **Future Master Shell convergence:** port this UI into AI Data Platform top-level shell when Vercel budget allows, connect AI Hub module registry with authenticated Windows service-manager control, and authorize reversible OFF controls with logs and owner confirmation. Do not enable original receiver until separately approved owner ceremony.
- **Slave monitoring and home automation:** signed health contract for iCamp/YW including source freshness and incident triage; host-local Home Assistant/MQTT/Ollama registered as optional services with isolation and no automatic physical commands.

**Current roadmap:** [QL-459–472 security and completion plan](https://github.com/RosevearCreations/rosevear-comms-hub/issues/925). Following QL-462, ten planned QL-463–472 builds remain in that plan, not a verified complete project count or a measured 10 percentage point growth across all axes.

**Ordered handoff** only through existing seven GitHub issues: [AI Data Platform](https://github.com/RosevearCreations/ai-data-platform/issues/934) → [AI Hub](https://github.com/RosevearCreations/rosevear-ai-hub/issues/768) → [Comms](https://github.com/RosevearCreations/rosevear-comms-hub/issues/917) → [iCamp](https://github.com/RosevearCreations/iCamp/issues/613) → [YW](https://github.com/RosevearCreations/yw/issues/800) → [Devil n Dove](https://github.com/RosevearCreations/devilndove-site/issues/920) → [Rosie Dazzlers](https://github.com/RosevearCreations/rosiedazzlers/issues/1080). These comments convey contracts but cannot prove peer deployment.
