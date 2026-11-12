# QL-420 — Three-Master incident assignment chronology, escalation SLA custody and recovery closure review

## Protected read-only evidence model

`runtimes/master-telemetry/ql420-incident-timeline.mjs` extends the QL-417 through QL-419 protected metadata projections. Inputs must be obtained and authenticated by a separately protected service. The function is a **read-only validation and presentation model**, not a new public receiver endpoint. It makes **no** Windows recovery, notification, signer enrollment, or connection changes.

The three source IDs remain `rosevear-ai-hub`, `rosevear-comms-hub`, and `ai-data-platform`. Each case timeline is source-scoped and ordered by the trusted timestamp: source observation, authenticated owner assignment history, externally evidenced escalation delivery, and independently reviewed owner closure requests. Unknown sources, orphan cases, source revision mismatch, duplicate proofs, invalid chronology, untrusted owner/custody assertions, and incorrectly correlated notification SHA-256 digests all fail closed.

The escalation policy follows QL-418: **CRITICAL = 15 minutes, REVIEW = 60 minutes**, both measured from the trusted observation timestamp, not from an inferred outage start. The expected escalation-SLA digest is calculated from the exact source, episode, source revision, observation time, SLA deadline, notification ID and digest, and notification time. A protected independent reviewer must authenticate the evidence and durable custody **before** the model may label an escalation on time or late; queued and failed notifications are never counted as delivered.

A recovery closure request can be `REQUEST_CLOSURE`, `REOPEN` or `CONTINUE_HOLD`. The independent reviewer must differ from the case owner, the source revision must match, and the review must occur after observed, assigned and notification evidence. A clean case with matching authorized export custody and independently reviewed SLA can be marked `OWNER_REVIEW_ELIGIBLE_NOT_ACCEPTED` **only**. A missing signature, replay admission, signed ACK, escalation proof or export receipt always prevents acceptance. The runtime receiver remains **OFF** and connection and owner-acceptance remain **HOLD** regardless of this projection.

### Production and operational separation

A successful GitHub `main` build does not verify Ree's installed Windows release (`DESKTOP-AE894KC`), its original-host signer custody, durable replay store, real one-TEST signed receipt, independent receiver ACK, continuous uptime or owner-authorized connection. These must come from genuine original-host evidence, never from test fixtures or browser flags. Do not post private keys, source payloads, credentials or raw signed envelopes to GitHub.

### MASTER360 handoff — direct instructions to AI Data Platform

`MASTER360-COMMS-QL420-HANDOFF | controller=ai-data-platform | source=rosevear-comms-hub | contract=rosevear.ql420.protected-three-master-timeline.v1 | source-scoped observed/assignment/escalation/closure timeline | independent escalation SLA evidence must match exact notification digest and controller/source revisions | critical=15m review=60m | require independently reviewed owner vs separate reviewer and committed closure custody | show reopened/missing proof as HOLD | do not infer actual uptime from evidence age | receiver=OFF | connection=HOLD | owner-acceptance=HOLD | slave-gate=HOLD | no Windows recovery execution`

**Next proposed QL-421 — Verified Incident Closure Evidence Reconciliation, Three-Master Operational Handoff and Owner Audit History.**
