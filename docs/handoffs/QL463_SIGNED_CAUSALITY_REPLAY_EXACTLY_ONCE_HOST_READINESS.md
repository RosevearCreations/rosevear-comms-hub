# QL-463 — Signed Event Causality, Independent Replay Custody, Exactly-Once No-Op Claim and Original-Host Supervision Readiness

## Release boundary and the seven-application direction

Rosevear Comms Hub is independently deployable under **AI Data Platform Build 408 protocol 1.1**, additive and compatible with existing 1.0 peers. This QL-463 work changes only Comms Hub. Vercel limits on AI Data Platform, Yard Workers and iCamp cannot stop unrelated Comms releases; a specific missing cross-app capability remains HOLD while separately authorized local operations continue.

**Do not confuse a successful GitHub/Cloudflare deployment with connected remote endpoints or installed Windows software.** No socket, remote transport, Caddy/Tailscale, service manager, database peer write, Home Assistant API, or physical receiver activation is introduced by this release.

## Three-stage signed event reconciliation

1. **Source and existing QL-462 custody.** Source signs the exact QL-462 nonpersonal outbox payload and a QL-463 event tying original messageId, global idempotency key, SHA-256 body digest, source app, tenant, workspace, target Master audience, source main SHA, protocol 1.0/1.1, and causal epoch to the immutable 0600 outbox digest. The Master independently signs the original QL-462 ACK with `SOURCE_REVIEW_ACCEPTED` and `runtimeConnection=UNVERIFIED_HOLD`. Both detached envelopes must validate using independently pinned Ed25519 public keys and independently checked original QL-462 outbox and ACK ledger records. Any QL-462 dead-letter is disqualifying.
2. **Three independent veto roles and chronological parent chain.** Signed QL-463 event (source), separately signed Master causality witness binding event/ACK/outbox, and third distinct owner-signed OPEN/HOLD review. The root requires `sequence=0`, `parentEffectKey=GENESIS` and SHA-256 zero parent; subsequent events must cite exact parent receipt and monotonic contiguous `sequence=parent+1` in the same source, tenant, workspace and Master audience. Cross-tenant/workspace parents and stale, swapped, unsigned, contradictory, escalated or replayed events remain HOLD.
3. **Durable one-use event/effect claim.** Original message idempotency, unique eventId and effectKey each reserve separately in an absolutely addressed, protected 0700 directory with O_EXCL 0600 file creation and fsync/readback. A partial/crashed reservation remains HOLD for manual reconciliation, never silently replayed. After source/owner evidence revalidation and trusted commit clock check the sealed event is `DURABLE_SIGNED_CAUSAL_REVIEW_ONLY`. A second **owner/host gated** call creates at most one `EFFECT_NOOP_EXCLUSIVE_CLAIM_NO_EXECUTION` receipt using O_EXCL. It **does not execute a payment, send a message, run a Windows command, or mutate external business state**. A signed ACK means evidence review only, not that a destination was actually reached.

**Exactly-once means exactly-once durable no-op *claim* in a shared protected filesystem, not end-to-end exactly-once effects.** Guaranteeing exactly-once external effects would additionally require an independently authenticated destination, transactional effect+inbox coordination, durable distributed idempotency across hosts, crash recovery, and per-tenant owner approval.

## Original Windows host DESKTOP-AE894KC

The intended unified server shell has three modules, under AI Data Platform controller:
- AI Data Platform — global intelligence/control shell.
- Rosevear AI Hub — private Windows automation, Ollama, Mosquitto MQTT, Home Assistant VM, Caddy/Tailscale.
- Rosevear Comms Hub — operator inbox, signed event tracking and read-only incident evidence.

The QL-463 **signed supervisor readiness report** requires an independently pinned original-host observer signing the exact host ID, current source timestamp, controller ID, and three module records in a fixed order. Only `UNVERIFIED_NOT_PROVISIONED` and `NOT_CONNECTED` values are accepted; `receiverActivationAuthorized=false`, `physicalReceiverOffVerified=false`, `serviceControlEnabled=false`, `networkReceiverEnabled=false`, `homeAutomationConnected=false`, `authorityTransfer=false`, incident OPEN/HOLD. A valid report is still `SIGNED_HOST_SUPERVISION_PLAN_REVIEW_ONLY`. It is neither proof of actual service installation nor evidence the physical receiver is presently OFF.

24/7 service installation, operator-controlled independent module lifecycle switches, signed health events, reboot recovery, Home Assistant commands, and live YW/iCamp source telemetry require separate implementation and explicit owner-supervised testing. The QL-462 Comms UI already provides *display-only* Master themes and three visual modules; it must not falsely imply it controls Windows processes. The eventual unified top-level AI Data Platform controller is tracked in [issue #958](https://github.com/RosevearCreations/ai-data-platform/issues/958), but that repository is not updated as part of QL-463.

## Security scope

- Private evidence stores are Node-host-only, **not** Cloudflare Worker/public access endpoints.
- Each original source and reviewer pin is assumed independently pre-enrolled, not generated or trusted based on a submitted envelope. The exact origin/source SHA is independently supplied. No private key enters GitHub.
- QL-461 tenant/role and consent gate remains the predecessor for QL-462 outbox creation; QL-463 independently rereads and verifies QL-462 signed source and Master ACK evidence before causal reconciliation.
- No T5 original-owner ceremony, delegated authority, raw customer data, write privilege, secret, cross-tenant metadata, remote executable effect or network receiver enablement.
- Peer outages block dependent handoffs, not the local three-module shell and unrelated company activities. Live source statuses remain HOLD until independent real source review and runtime acceptance.

## CI and release procedure

Run `node --test runtimes/master-telemetry/ql463-event-causality-effect-host.test.mjs` along with the protected QL-417–463 workflow. Preserve unchanged existing QL-336A fail-closed app build, protected original Windows owner-key safety gate, QL-329 core asset budget, Supabase, Cloudflare Production and public JS/CSS SHA parity. Promote via PR to `dev`, then a **byte-identical scoped PR based on current `main`**; require exact post-merge main SHA GREEN before claiming delivery. The temporary PR branches can be deleted only after checking merge/open PR status, while permanent refs should remain `dev` and `main`.

## Ordered peer communication without lockstep releases

Record final Comms GREEN and exact peer source SHAs on existing issues in order: [AI Data Platform #934](https://github.com/RosevearCreations/ai-data-platform/issues/934) → [AI Hub #768](https://github.com/RosevearCreations/rosevear-ai-hub/issues/768) → [Comms #917](https://github.com/RosevearCreations/rosevear-comms-hub/issues/917) → [iCamp #613](https://github.com/RosevearCreations/iCamp/issues/613) → [YW #800](https://github.com/RosevearCreations/yw/issues/800) → [Devil n Dove #920](https://github.com/RosevearCreations/devilndove-site/issues/920) → [Rosie #1080](https://github.com/RosevearCreations/rosiedazzlers/issues/1080). No peer code, deployments, module service toggles or source signers are automatically changed by a GitHub comment.

**Next QL-464:** Comms Operator UI, Accessibility, Responsive Incident Timeline, Actionable Source-State Displays & Measured +10pp CX Tranche. **Proposed queue:** nine QL-464–472 builds remain in the original 14-item plan, not the complete application roadmap.
