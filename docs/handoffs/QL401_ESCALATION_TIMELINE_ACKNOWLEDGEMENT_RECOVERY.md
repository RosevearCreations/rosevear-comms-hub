# QL-401 — Operator Escalation Timeline, Handoff Acknowledgement Preview & Safe Recovery Guidance

## Purpose and trust boundary

QL-401 extends the QL-400 role-only draft assignment review with an ordered, source-bound **synthetic** chronology, a role-based acknowledgement storyboard and explicit steps for safely recovering stalled or conflicting handoffs. It is a read-only, offline operator preview, **not** a live acknowledgement queue, notification, staff assignment, owner authorization, audit storage, real-time escalation or incident closure. No network request or mutation is made by the preview.

The three demo assignments represent only registered shell IDs (`devilndove`, `rosevear-ai-hub`, `icamp`), not their tenant customers or actual employees. Fixed scenario clock: **2026-11-09 09:45 UTC**. Two demo receipt markers show what an acknowledgement *might* look like, including one after its illustrative deadline; the third has no scenario marker. These sample role labels are **never verified people, signed receipts or accepted assignments**.

## Chronology and integrity checks

Every acknowledgement marker requires a unique opaque ID, exact QL-400 assignment ID, queue ID, source shell, correlation, prescribed custodian role, `SCENARIO_RECEIVED` outcome and a well-formed UTC time between that assignment's draft time and the scenario clock. A maximum of 30 markers is permitted. Duplicate marker IDs, more than one marker per assignment, collisions with assignment or existing HOLD trace IDs, wrong source/role/correlation, forged outcomes, invalid/future timestamps and invalid QL-400/399 upstream evidence **reject the entire read model** into HOLD with no rows.

Each displayed chronology merges source- and gate-matched QL-398/399 HOLD traces, the QL-400 drafting event, the illustrative due-time milestone, any simulated acknowledgement and the current escalation review. Entries sort by UTC time and stable ID. Future due-time milestones are labeled upcoming; elapsed windows are explicitly not live SLAs. Source or correlation IDs cannot be swapped between cases to manufacture evidence continuity. Filters for shell and sample acknowledgement state only change the local rendering.

The QL-401 read model hardcodes original evidence `NOT_VERIFIED`, both source/master-owner approvals `NOT_VERIFIED`, witness `NOT_ATTESTED`, `handoffAccepted=false`, `assignmentActive=false`, `sendEnabled=false`, `persisted=false` and `closureState=HOLD`. Counts of verified handoffs and authorized closures are **always zero**. No synthetic acknowledgement can change these fields or imply approval or receiver enrollment.

## Safe recovery guidance for actual operations

1. Leave the real incident and handoff on HOLD. Do not auto-send, auto-retry, release, close or reassign on the basis of this preview.
2. In a protected operator workflow, independently identify the *actual* intended custodian and verify a signed acknowledgement if required. A matching role in this demo is not an identity claim.
3. For a real overdue item, determine the genuine deadline and authorized escalation owner. For a conflict, reconcile the original source and reviewer evidence independently. Missing scenario markers are not proof that anyone was or was not contacted.
4. Recheck original source-bound receipts, age and provenance, separate source-owner and master-owner signed decisions, independent signer/witness separation, pin custody, receiver enrollment, server-side replay and retention audit, and scoped consent.
5. Record real dispositions only in authenticated, authorized, tamper-evident operating workflows. Re-evaluate closure eligibility there; this software preview cannot unblock HOLD.

AI Data Platform owns master evidence, application health and module completion analytics; Comms Hub owns authenticated communications and operator incident workflows. Shell-level integration does not authorize tenant record access. Production software GREEN must be distinguished from original-evidence, operator or owner-trust GREEN.

## Test and promotion acceptance

Run QL-401 model/unit and owner drilldown UI tests, full Vitest suite, TypeScript/Vite build and the protected `dev` then `main` CI paths. Preserve Windows encrypted owner-key checks, source-trust gates and production public Worker JS/CSS parity. Confirm post-merge commit/tree and production workflows before calling **software** Production GREEN. Never bypass trust verification to satisfy a status label.
