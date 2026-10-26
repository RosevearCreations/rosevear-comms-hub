# QL-219 — Four-Company Recurrence Follow-Up Outcome Reconciliation & Independent Closure Readiness Review

Release marker: `ql219-four-company-recurrence-followup-outcome-independent-closure-readiness-disabled-preview-v1`

## Purpose

QL-219 extends the QL-218 four-company, browser-session-only fictional recurrence register. Its **Outcome reconciliation & closure readiness** workspace traces synthetic follow-up findings for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers through an explicit independent-review readiness checklist. It does **not** perform real independent review, certify closure, unlock communications, collect signatures or modify Supabase.

## Owner-safe workflow

1. Prepare a QL-218 `local_hold_followup_prepared` record from the current QL-217 and QL-211–QL-216 chain. Every QL-218 open gap is still unverified.
2. Explicitly start a QL-219 outcome reconciliation. QL-219 records a local comparison token for the QL-218 source, including recurrence count, source status, fictional cycles, selected disposition and private-note changes. This token is not a secure signature or signed reviewer receipt.
3. For each unresolved gap, choose one fictional outcome: **open exception reconfirmed**, **source evidence still missing**, or **fictional comparison stable but unverified**. Select an unsent next-step: **maintain hold**, **request new evidence**, or **independent review required**. Enter only invented scenario notes, never private/customer data. No choice signifies a real-world resolved issue.
4. Each gap with simulated recurrence count above zero requires **independent review required** as its follow-up before the local packet can be prepared. This requirement routes recurrence risk to a future human; it is not proof that anyone reviewed it.
5. Explicitly acknowledge the three local readiness checklist items: source trace, recurrence escalation and release-hold/permission boundaries. Each acknowledgement has status `ACKNOWLEDGED_UNVERIFIED`, never actual human approval.
6. When all source gaps are classified, recurrence escalation drafts are present and all three checklist items were acknowledged, **Prepare independent-review readiness packet** becomes available. Its phase is `independent_review_packet_prepared`, meaning only a local packet for future human inspection. Actual independent closure and release remain false.

## Source-change and privacy safeguards

- An updated QL-218 recurrence audit, new outcome evidence, changed fictional cycle, QL-217 reassessment, or any QL-211–QL-216 upstream revision invalidates QL-219 source. Old records freeze as `RECURRENCE_SOURCE_REVISED` or `UPSTREAM_STALE`.
- Source acceptance requires an explicit user-confirmed reset of the selected case. This discards its prior fictional outcomes, acknowledgements and local packet, without touching any other case/company. A withdrawn scenario stays counted as orphaned, not closed.
- Data is held in React browser-session state. No customer records, reviewer credentials, signatures, export operation, backend write, Supabase schema migration, real telephony integration or external delivery are added.
- The receipt is a fixed-schema, PII-minimized status summary. It omits all free-text outcome notes, source fingerprints and reviewer/customer identities.
- The QL-181 read-only prerequisite register remains **12/12 `HELD_UNVERIFIED`**, and `conditionalRelease: BLOCKED` is immutable. Software production GREEN never implies a live communications pilot is authorized.

## Acceptance criteria

- Four-company registry and strict company/case record isolation.
- Source-current, prepared QL-218 input required; unprepared/missing/stale source and incorrect enum/note inputs rejected.
- Every gap classified; recurrence requires explicit independent-review follow-up draft; three checklist acknowledgments before preparing a local packet.
- Local preparation locks further edits and leaves actual independent closure and owner authorization false.
- Source-change freeze, explicit case-only reset and withdrawn-case accounting verified.
- No live calls/SMS, provider connection, external writes or release-hold transition.
- TypeScript, Vitest (including integrated QL-211→QL-219 workflow), production Vite and GitHub Pages builds, GitHub CI release harnesses and exact-main published release marker verified before marking the software deployment GREEN.
