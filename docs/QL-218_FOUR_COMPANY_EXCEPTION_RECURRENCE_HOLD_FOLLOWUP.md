# QL-218 — Four-Company Reassessment Exception Recurrence, Owner Decision Replay & Conditional Hold Follow-Up Audit

Release marker: `ql218-four-company-exception-recurrence-owner-decision-replay-hold-followup-disabled-preview-v1`

## Scope and operation

The new **Recurrence replay & conditional holds** workspace follows QL-217 within the disabled-preview operator console for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. Its complete audit ledger exists only in browser memory; there are no remote writes, provider calls, notifications, scheduled jobs, signed reviewer approvals, customer data transfers or persisted real decisions.

1. Record synthetic QL-211 observations and prepare the locally simulated QL-212–QL-217 chain. All QL-217 gaps must have drafted reassessments and QL-217 must show `local_reassessment_prepared` with a current QL-216 source.
2. Start an explicit QL-218 fictional recurrence replay from that prepared source. Choosing a gap records a fabricated owner-decision replay disposition, a conditional-hold follow-up draft and a short invented note. These are **not** real owner approvals or independent reviews.
3. The local cycle can be incremented manually, up to 20. A gap can only be replayed once in a single cycle. A repeat in a subsequent cycle increases both replay count and simulated recurrence count. No passive timers, overdue alerts or actual recurrence detections are claimed.
4. A gap is due for a new drafted hold follow-up after two unattended cycles for P0/P1 or four for P2/P3. Preparation requires at least one replay for each unresolved gap and no due follow-ups. Even when prepared, all gaps remain unverified and the conditional release is blocked.
5. The four-company summary shows eligibility, tracked cases, simulated recurrence, due follow-ups, local packet preparation and stale records. The read-only QL-181 register still shows 12/12 `HELD_UNVERIFIED`. A fixed-schema receipt contains only company/scenario identifiers, status codes, invented counters and mandatory negative safety attestations. It excludes source tokens, private notes, reviewers, customers and personnel.

## Source reconciliation and reset

QL-218 captures a local non-cryptographic comparison fingerprint of the prepared QL-217 reassessment, its current upstream status, fictional cycles and gap-level actions. If any contributing source is revised, the QL-218 record freezes with `REASSESSMENT_CHANGED` or `UPSTREAM_STALE`. A changed but eligible QL-217 packet can only be accepted by **explicitly confirming** a new local baseline. Doing so discards the chosen scenario's former invented cycles, recurrences and decisions; it does not alter any other company or case. Withdrawn QL-211 findings remain counted as orphaned, not verified or closed.

## Verification requirements

- Reject QL-218 creation without a current, locally prepared QL-217 source.
- Reject malformed dispositions, follow-up status, too-short notes, same-cycle replay duplicates, edited prepared packets and all stale-source writes.
- Recount fictional recurrence only after the next manual cycle. Enforce P0/P1 and P2/P3 hold-follow-up age intervals and the 20-cycle cap.
- Require a current local follow-up on every unresolved gap before allowing local preparation. Never mark independent evidence verified or authorize release.
- Verify all four company ledgers are isolated; all 12 hold prerequisites stay `HELD_UNVERIFIED`; no real calls, SMS, exports, provider connections or external writes occur.
- Verify responsive keyboard-accessible navigation, explanatory help, source-reset confirmation, and receipt redaction.

## Deployment acceptance

A successful CI/build and preview publication can mark this **software build** GREEN while the real-world phone/SMS pilot remains BLOCKED. Real production communications require separate human-led evidence, security/privacy approval, independent verification and explicit owner authorization under the QL-181 gate. Nothing in QL-218 substitutes for that review.
