# QL-223 — Four-company owner-decision aging, evidence follow-up and conditional hold oversight

## Operator scope

QL-223 extends prepared fictional QL-222 exception packets for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. The **Owner decision aging & conditional holds** workspace is a disabled browser-session preview, not an evidence system of record. It never contacts customers, reviewers or providers.

- An eligible case requires an unchanged, locally prepared QL-222 packet containing refreshed exception gaps.
- Every gap gets an invented evidence follow-up classification and unsent owner routing decision. A synthetic case cycle can advance from zero to twelve; an untouched follow-up is **approaching due at cycle age two** and **overdue at age three**. The due cycle is visible per gap. No real calendar reminder is scheduled.
- Previously recurring QL-222 exceptions, P0 gaps and newly recurring fictional evidence require a draft independent referral before the QL-223 local packet can be prepared. A new fictional exception increments once per gap per simulated cycle, even after repeated edits in that cycle.
- Three required local unverified acknowledgments cover decision aging, evidence follow-up provenance and all twelve unchanged QL-181 release holds. Preparation requires every gap classified, no overdue follow-up, completed acknowledgments and all required independent referral drafts.
- A locally prepared packet becomes read-only. It is explicitly **not** a verified independent reassessment or an owner authorization to release.

## Source change and privacy controls

- A revised QL-222 decision note, gap disposition, recurrence count or earlier evidence source freezes the QL-223 ledger for that case. Starting again requires an explicit **case-only reset** with a warning that the local aging, notes, counts, acknowledgments and packet will be cleared; other organizations and scenarios remain intact.
- Removed cases count as orphaned rather than closed. No stale or orphaned case can be promoted to local prepared status.
- Exported text is a fixed-schema local status receipt: codes, synthetic ages, counts and QL-181 prerequisite states only. Free-text notes, source fingerprints, customer details and reviewer identities are excluded.
- No Supabase schema, auth, permission, storage or data operation changes. No live telephony, SMS, callbacks, persistence, customer notifications, external writes or provider calls.

## Release safety invariants

- Exactly **twelve QL-181 prerequisites** must remain `HELD_UNVERIFIED` and conditional release must remain `BLOCKED`.
- Every real-approval and release-related contract flag remains `false`, irrespective of synthetic follow-up status.
- Software production promotion does not prove any real-world owner decision, independent evidence closure or pilot acceptance.

## Validation

From `app/`, run `npm run check`, `npm test -- --run`, `npm run build` and `npm run pages:build`. The QL-223 tests use the full synthetic QL-211→QL-222 scenario construction and exercise follow-up aging thresholds, exception-event de-duplication, escalation gating, source revision freeze/reset, four-company isolation, receipts, UI and all twelve held prerequisites. After PR approval, verify the exact `main` branch promotion and the publicly served release marker:

`ql223-four-company-owner-decision-aging-evidence-follow-up-conditional-hold-oversight-disabled-preview-v1`.
