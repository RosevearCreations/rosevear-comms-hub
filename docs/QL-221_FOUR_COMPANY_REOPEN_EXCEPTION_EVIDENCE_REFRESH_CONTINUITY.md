# QL-221 — Four-Company Reopened Exception Follow-Up Reassessment, Evidence Refresh & Release Hold Continuity Audit

Release marker: `ql221-four-company-reopened-exception-reassessment-evidence-refresh-hold-continuity-disabled-preview-v1`

## Scope

The **Evidence refresh & hold continuity audit** operator workspace extends QL-220 across Rosie Dazzlers, Devil n Dove, iCamp and YW. It is a **browser-session-only, fictional review aid**. It never validates actual new evidence, imports a real attachment, contacts an independent reviewer, approves an owner decision, closes a case, lifts a release hold, makes a call, sends SMS or changes Supabase.

## Review flow

1. Prepare a current, fictional QL-220 `owner_followup_audit_prepared` record linked through QL-211–QL-219. An unprepared, missing or source-stale record is ineligible.
2. Explicitly begin a QL-221 local refresh; its source fingerprint includes the prepared QL-220 record's case/source identity, every gap's fictional disposition and note, cycle state and acknowledgments. The fingerprint is an invalidation token, never a cryptographic signature or proof of independent review.
3. For each currently open QL-220 gap, choose a fictional evidence status (**source unchanged and unverified**, **invented evidence pending review** or **gap still open**), a controlled source label (**QL-220 local replay**, **fictional owner attachment** or **simulated retest**) and an unsent owner action. There are no actual URLs, files, private data or customer details in source labels.
4. Recurring exception gaps must retain a draft independent-review escalation before audit preparation. Every gap remains unverified and open regardless of its simulated status.
5. Advance simulated review cycles (maximum 12). A recorded refresh becomes overdue after three simulated cycles without a new fictional refresh note. Updating only that gap's record clears only that gap's simulated overdue status; no real reminder, calendar event or notification is issued.
6. Acknowledge three local, **unverified** checks for source trace, owner follow-up reassessment and release-hold continuity. Prepare the local `release_hold_continuity_audit_prepared` packet only when all gaps have status-only refreshes, no gap is overdue, required escalation drafts exist and all three checks are acknowledged. A prepared packet locks editing, but does not indicate real approval or closure.

## Integrity and safety controls

- Revisions to the prepared QL-220 record, its free-text notes, source tokens or any upstream evidence freeze QL-221 as `REOPEN_SOURCE_REVISED` / `UPSTREAM_STALE`. Explicit user-confirmed reset discards only that selected case's local refresh entries, cycle aging, acknowledgments and packet. Removed cases remain counted as orphaned or stale, **not closed**.
- The receipt uses a fixed schema and status codes, excluding all free-text notes, source fingerprint tokens, reviewer identities, actual customer information, attachment content or sensitive source details. All ledgers remain scoped to company and case in browser memory.
- All **12/12 QL-181 real-pilot prerequisites** remain `HELD_UNVERIFIED` and `conditionalRelease: BLOCKED` never changes. No database mutation, provider connection, calls, messages, owner authorization or independent closure exists in this release.
- Software **Production GREEN** represents a deployed and tested disabled-preview artifact, **not permission to operate a live communications pilot**.

## Required verification

- Four-company isolation, empty/ineligible states, current QL-220 dependency, recurrence escalation and controlled evidence sources.
- Simulated aging, per-gap refresh, all checklist acknowledgments, prepared-packet lock, stale/source-change freeze, case-only reset and orphaned case status.
- Redacted receipt, 12/12 unchanged hold states, zero external writes/calls/SMS.
- TypeScript, Vitest, production Vite and GitHub Pages builds; full CI on both promotion PRs and exact deployed `main` asset marker before calling production GREEN.
