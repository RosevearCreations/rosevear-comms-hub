# QL-217 — Four-Company Owner Handoff Reconciliation, Escalation Decision Aging & Independent Evidence Reassessment

Release marker: `ql217-four-company-owner-handoff-decision-aging-evidence-reassessment-disabled-preview-v1`

## Goal

Extend QL-216's fictional, local owner-safe handoff packets into source-reconciled **unverified independent-evidence reassessment planning** for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers.

## Operator workflow

1. Complete a **fictional** QL-211→QL-215 observed-gap, synthetic repair/retest, review preparation, evidence-gap intake and simulated escalation. Never enter live customer information.
2. In QL-216, create and locally prepare an owner-safe handoff packet. This action does not dispatch it.
3. In the new **Owner handoff & evidence reassessment** workspace, choose a current prepared QL-216 packet and explicitly begin local reassessment.
4. Optionally advance the *simulated* decision cycle. P0/P1 unresolved gap decisions become due after three unattended simulated cycles, and P2/P3 after five.
5. For each open gap, choose a local fictional evidence-recheck/retest/replay action and enter a fictional note. The gap remains unverified; the decision's simulated aging resets for that category only.
6. When each gap has a recorded local action, prepare a session-only reassessment summary for future human inspection. Review four-company counts and a fixed-schema, PII-minimized receipt.

## Safety and reconciliation

- QL-217 does not invent reviewer attestations, independent retest completion, production safety evidence, real owner authorization, gap closures, messages, or downstream system writes.
- A QL-217 record is only eligible if QL-216 has a **current** `local_handoff_prepared` packet. It snapshots the QL-216 packet, open-gap states, and upstream review context into an in-memory comparison token; the token is not a secure signature.
- QL-216 packet revisions or QL-211–QL-215 changes freeze old reassessment records. Explicit local reset discards that case's simulated history and notes; all other company cases are unaffected. Withdrawn cases become stale, not closed.
- No real elapsed-time tracking, background schedules, provider actions, outbound notifications, communications, or Supabase writes are enabled here. Simulated intervals advance only on clicks.
- Fixed-schema receipts include status codes and counts, not source fingerprints, free-text notes, reviewer identity or customer details.
- All **12 QL-181 prerequisites** stay `HELD_UNVERIFIED`, `conditionalRelease=BLOCKED`, with real owner approval and independent evidence verification `false`. GREEN software deployment is not permission for live communications.

## Acceptance checks

- Start empty for all four companies; no automatically invented sign-off or evidence.
- Reject reassessment unless QL-216 handoff was locally prepared and remains source-current.
- Verify P0/P1 and P2/P3 decision-aging thresholds, per-gap reset, cap at 20 simulated cycles, and local preparation only after all open gaps have fictional actions.
- Freeze on upstream or handoff change; require explicit reset. Keep withdrawn cases stale.
- Verify company isolation and fixed-schema receipt redaction, plus keyboard labeling and responsive layout.
- Run TypeScript, all tests, app and Pages builds before promoting through `dev`, then `main`; independently validate exact-main production jobs and the live release marker.
