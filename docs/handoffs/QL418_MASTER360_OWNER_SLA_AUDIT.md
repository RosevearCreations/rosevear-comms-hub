# QL-418 — Protected evidence owner assignment, discrepancy SLA and three-master acceptance audit

## Scope and safety

This adds a deterministic, **metadata-only** protected projection on top of QL-417. It does not enroll source signers, admit original-host receipts, activate a receiver, or assert real uptime or owner acceptance. All connection and slave gates remain HOLD / OFF. The source code must not be treated as proof of runtime deployment or operator enrollment.

`runtimes/master-telemetry/ql418-owner-sla-audit.mjs` accepts QL-417 episode/decision metadata and verified assignment records (source, episode, pseudonymous owner ID, authorized role, action, assignment timestamp and SHA-256 custody digest). Assignment chronology must be strictly increasing per source/episode; malformed, orphan, duplicate, unverified or future records fail closed. Protected callers must validate the identity, timestamps, provenance and custody independently, rather than trusting flags from browser input.

For open discrepancies, the audit records elapsed age since evidence observation (not measured uptime), source revision, severity, owner's assignment, pending/reopened decision continuity, and SLA status. Policy for this release: CRITICAL = 15 minutes from evidence observation, REVIEW = 60 minutes, with exact deadline and overdue seconds. Missing assignments stay UNASSIGNED. Acceptance for review is **not** final resolution. Audit export is deterministic sanitized JSON and is withheld unless both protected export authorization and independent audit reviewer verification are confirmed by the trusted runtime. No private keys, raw signed envelopes, credentials or sensitive original-host payloads are exported.

## Direct instruction to AI Data Platform

`MASTER360-COMMS-QL418-HANDOFF | source=rosevear-comms-hub | controller=ai-data-platform | contract=rosevear.ql418.three-master-acceptance-audit.v1 | use docs/handoffs/QL418_MASTER360_OWNER_SLA_AUDIT.md | reconcile QL417 source/episode/revision identities | authenticate protected owner-role and independent assignment custody | report CRITICAL=15m REVIEW=60m SLA and overdue state | authorize audit export only after independent reviewer gate | no original-host sample assumed | uptime=UNKNOWN | owner-acceptance=HOLD | receiver=OFF | connection=HOLD | slave-gate=HOLD | do not infer CONNECTED from code GREEN`

## Outstanding live proof

Original Ree Windows installed-release identity, independent signer custody, genuine one-TEST signed source envelope, committed durable replay admission, and independently signed Comms receiver ACK require original-host observation. This release does not change Windows recovery or automation.

**Next proposed QL-419 — Protected Discrepancy Case Assignment Review, Escalation Notification Evidence & Export Custody Verification.**
