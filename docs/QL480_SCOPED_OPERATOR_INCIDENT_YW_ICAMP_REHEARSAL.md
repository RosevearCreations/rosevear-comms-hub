# QL-480 — Reusable scoped operator incident adapter and Yard Workers / iCamp recovery rehearsal

## Current source capabilities versus the Master Recommendation Review

The owner-provided **Rosevear Three Master Application Review (November 20, 2026)** sets distinct responsibilities: AI Data Platform owns fleet measurements and source health, Comms Hub owns operator cases, follow-up and delivery evidence, and Rosevear AI Hub owns local workshop observations. Each business retains its records, financial systems, permissions and customer operations. Treat the recommendations as **proposed goals**, not existing production certification.

Earlier QL-419/420 modules project protected case reviews; QL-432/449 guard master incident recovery, and QL-479 supplies an opt-in private signed telemetry transport. None of those proves a reusable per-business/tenant operator case that survives an actual interrupted private worker. QL-480 fills the **durable private adapter / controlled simulation** gap without asserting the still-unverified original-host and seven-source field enrollment.

## What QL-480 implements

- `runtimes/master-telemetry/ql480-scoped-incident-adapter.mjs`: a reusable server-side adapter for `yard-workers` and `icamp`. Every source event is an exact allowlisted, Ed25519-signed, **non-sensitive scoped exception** with source revision, event/episode ID, occurrence time, opaque source record ID, causation/correlation and receipt digest.
- A case is keyed by **source application + environment + tenant + episode**. Duplicate signed event ID and identical bytes creates no new effect; conflicting use of that ID is rejected. Repeated outage observations append occurrences to the existing case rather than creating duplicate cases. Recovery is a separate technical milestone; only a correctly signed private operator decision bound to the current recovery receipt can close the case once. An older outage arriving after closure is kept in history without reopening the episode.
- A private on-disk append-only journal with SHA-256 digest chain, exclusive per-case lock, fsync, restricted file permissions, and signed-receipt replay validation. It detects truncation or partial corruption on restart and fails closed. A chain is **not an independent off-host immutable backup**; malicious full-history rewrites require external anchoring to detect. Manual recovery is required for a stale crash lock; this code never silently discards that lock.
- Transition and outgoing **intent** are written in the same durable record. Stable intent keys, operator-signed claim commands, bounded 30-second leases, reclaims after expiry, attempt limit of three, and terminal disposition provide recovery after a restart. QL-480 intentionally implements **no provider transport**: disposition is `SIMULATED_PRIVATE_NO_SEND`, never delivery or provider acceptance.
- Private scoped read requires a signed operator request. No customer names, contact details, raw case notes, payment details, financial writes, marketing sends, external network routes, listener, Cloudflare public route or original Windows-host modification.
- `scripts/ql480-two-source-rehearsal.mjs` runs an isolated short-lived demonstration for synthetic **Rosevear Landscaping** and **Camp Rosevear**. Both rehearsals use generated disposable signer keys, private temporary storage and a fixed clock. Each case opens, deduplicates, recovers, requires private operator closure and survives a new adapter instance; the script verifies no cross-source case contamination and deletes its own temporary simulation directory.
- `ql480-scoped-incident-adapter.test.mjs` is a required CI gate with additional adversarial scenarios: invalid signer/PII, foreign-tenant read, ID conflict, old event after recovery, recovery before outage, lease contention and timeout, duplicate operator closure, journal truncation/tamper and restart recovery. The original 43 legacy QL336A gates remain unchanged.

Run the rehearsal from the repository root:

    node scripts/ql480-two-source-rehearsal.mjs

Its terminal state is `SYNTHETIC_TWO_SOURCE_REHEARSAL_PASSED_NOT_PRODUCTION`. It is not a live customer/tenant event.

## Exact scope and acceptance distinctions

| Evidence | What QL-480 can demonstrate | What remains unverified |
|---|---|---|
| Private operator incident source adapter | Both canonical source IDs can use the same schema/adapter in isolated tests | Real signed Yard Workers / iCamp source credentials and operational routes |
| Case state & duplicate suppression | One case per signed scoped episode; signed receipt and durable restart replay | Operator-facing production UI and independently verified retention backup |
| Recovery and closure | Technical recovery distinct from owner-signed closure; stale outage history held | An actual owner resolving a real live business case |
| Outgoing intent | Transactionally stored with transition; lease/retry/simulation-only disposition | Any provider acceptance, external delivery, human reply or customer outcome |
| Scope isolation | Synthetic cross-tenant/brand tests reject unauthorized read or malformed scope | Real tenancy RBAC integration and human access audits |
| Fleet reliability | Deterministic rehearsal and negative tests | Seven-source sustained health, live coverage, stale receipt history and cross-master convergence |

## Review-driven build queue

**Next proposed QL-481 — Scoped Private Incident Operator UI, Durable Recovery Handover & Independent YW/iCamp Adapter Field Integration.** Integrate the QL-480 case contract with an authenticated private owner screen and backend storage, preserve separate platform-operator versus tenant permissions, and connect only an independently authorized signed source. The first live workflow should be one missing Yard Workers heartbeat, one case, assigned owner, recovery proof and single closure; repeat with iCamp independently. Do not credit CI simulation as a real production journey.

Then prioritize: (a) accepted provider-specific delivery references and consent checks, (b) source/episode dedup under multiple worker crashes, (c) cross-tenant RBAC and inaccessible source links, (d) case age/SLA and first operator acknowledgment metrics, (e) isolated backup/restore with signed external anchors, (f) fleet freshness and seven-source observability with AI Data Platform, and (g) measurement of sustained uptime, delay and cost. Business-specific accounting remains in each product.

## Release and field gates

A **GREEN source release** requires successful dev and protected main merge, application/Windows CI, Cloudflare production build and public asset SHA-256 parity. It does **not** prove the original Windows host, YW/iCamp production signer enrollment, customer outcome, actual provider delivery, or durable offsite restore. Never delete historical Windows source directories, enable port 8788, register a startup task or weaken prior fail-closed QL-340–QL-479 rules in order to pass QL-480.

Track completion separately across **feature implementation**, **verified production journeys** and **sustained field reliability**, as directed by the Master Review (pages 9–10). Synthetic rehearsals earn test coverage, not runtime acceptance.
