# QL-417 — Protected Master evidence discrepancy worklist, uptime episode aging and owner decision continuity

This release adds an **inert, read-only** protected worklist. It does not claim that genuine original-Ree-host telemetry has been received or that the Master systems are connected.

`runtimes/master-telemetry/ql417-discrepancy-worklist.mjs` takes bounded, protected evidence metadata from the three Masters, an exact AI Data controller revision, independently verified owner/reviewer decision metadata and a trusted evaluation timestamp. It rejects duplicate episode IDs, future observations, foreign sources, orphan decisions and invalid custody assertions. Every row retains source identity, episode, revision, observation age, signature, replay and receiver-ACK discrepancies, plus the latest valid owner decision.

The resulting worklist orders missing signatures and replay admission first, then stale observations and missing receiver or owner decisions. Aging means elapsed time since the signed observation, **not** a continuous uptime percentage or a confirmed outage. It does not assert that input boolean flags are authentic: the protected runtime must authenticate source, reviewer, and storage itself; no untrusted web form may populate the authority assertions.

## Direct AI Data Platform instruction

`MASTER360-COMMS-QL417-HANDOFF | controller=ai-data-platform | source=rosevear-comms-hub | use docs/handoffs/QL417_MASTER360_DISCREPANCY_WORKLIST.md | independently import real original DESKTOP-AE894KC signed telemetry, durable replay admission and signed Comms ACK | attach exact source/controller revisions and observation age | place unresolved signature/replay/ACK or owner-decision discrepancies in protected worklist | preserve chronological owner accept/reopen continuity | show uptime UNKNOWN until actual source samples verified | receiver=OFF | connection=HOLD | slave-gate=HOLD | do not infer MASTERS_SYNCED from code GREEN`

## Outstanding owner acceptance

The original Ree Windows installed-release, independent public-key custody, genuine one-TEST signed source envelope, protected durable replay proof and separately signed Comms ACK all require independent observation. Do not publish private keys or sensitive host evidence to GitHub or chat. No Windows recovery or scheduler changes are part of this build.

**Next proposed QL-418 — Protected Evidence Owner Assignment, Discrepancy Resolution SLA & Three-Master Acceptance Audit Export.**
