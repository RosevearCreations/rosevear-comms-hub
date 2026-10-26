# QL-220 — Four-Company Independent Review Outcome Reopen, Closure Exception Monitoring & Owner Follow-Up Audit

Release marker: `ql220-four-company-independent-review-reopen-closure-exception-owner-followup-disabled-preview-v1`

## Scope

The **Reopen exceptions & owner follow-up audit** operator workspace extends QL-219 for Rosie Dazzlers, Devil n Dove, iCamp and YW. It is **disabled-preview only**: a browser-session rehearsal of reopening fictional evidence-gap review, monitoring simulated follow-up cycles and preparing a redacted owner follow-up audit. This does not reopen or close a real independently reviewed matter. It does not issue reviewer approval, waive a hold, send SMS, make calls, or write to Supabase.

## Workflow

1. Record a QL-211 fictional observation and prepare source-current QL-212→QL-219 artifacts, including the QL-219 `independent_review_packet_prepared` readiness packet. A draft, missing or stale QL-219 packet is not eligible.
2. Select a company and finding. Explicitly start local reopen monitoring with an invented reason (minimum eight characters); QL-220 captures a fingerprint of the exact QL-219 source case, its gap outcomes, private note revisions, checklist and upstream source identity. The fingerprint is a local change detector, not a signed proof.
3. For every gap, choose a fictional reopen/monitor disposition and one **unsent** owner next step. Recurring exceptions require `INDEPENDENT_REVIEW_ESCALATION_DRAFT` to be recorded before a local audit can be prepared. All gaps stay independently unverified and not closed.
4. Use **Advance simulated review cycle** (0–12) to rehearse follow-up aging. A gap reaches `followUpOverdue` at three cycles after its most recent fictional note. Re-recording an invented next step refreshes only that gap's simulated age. This does not schedule or dispatch a reminder.
5. Acknowledge three `ACKNOWLEDGED_UNVERIFIED` local checklist items: reopen provenance, owner follow-up and hold continuity.
6. Prepare a local `owner_followup_audit_prepared` packet only when every gap has a decision, recurring gap escalations are drafted, simulated overdue follow-up count is zero and all local checks have been acknowledged. The prepared packet locks edits; neither owner authorization nor independent closure is conferred.

## Source invalidation, privacy and release boundaries

- Changing the prepared QL-219 packet, any of its source evidence, gap notes or recurrence follow-up freezes QL-220 as `CLOSURE_SOURCE_REVISED` or `UPSTREAM_STALE`. The operator may explicitly reset **only the selected case** using the revised eligible source; the previous local gap entries, aging and acknowledgments are discarded. A removed case is counted orphaned/stale, never closed.
- Company-scoped state lives only in React browser-session memory. No source tokens, free-text reopen reasons, gap notes, customer data, names, phone numbers, signatures or credentials appear in the fixed-schema receipt. No migration, database access or third-party provider integration is needed.
- All **12/12 QL-181 prerequisites** remain `HELD_UNVERIFIED`, with immutable `conditionalRelease: BLOCKED`. No real pilot activation, calls, messages, external writes, authenticated independent review or actual owner approval occurs. Software **Production GREEN** is a build/deployment status, not a real-world permission grant.

## Acceptance

- Four-company isolation, empty states, QL-219 provenance gating and source-change freeze verified.
- Invalid inputs rejected; case-only reset, withdrawn-case accounting, per-gap follow-up aging and recurrence escalation contract tested.
- Local three-check preparation and post-preparation lock verified; redacted receipt and disabled-provider boundaries tested.
- TypeScript, unit/UI suites, Vite and Pages builds, GitHub Actions checks and deployed release marker must pass on the exact main commit before the software release is called GREEN.
