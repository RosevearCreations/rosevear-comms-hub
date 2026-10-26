# QL-222 — Four-company evidence-refresh exception recurrence, owner decisions and hold recheck

## Scope

The QL-222 workspace extends QL-221's fictional, locally prepared evidence-refresh cases for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. It is a **browser-session-only disabled preview**. The operator can replay a refreshed exception, record a fictional recurrence type, draft an owner follow-up decision, advance a bounded simulated follow-up cycle, and review an independent hold-recheck checklist.

The new Operator Console navigation entry is **Exception recurrence & owner decisions**. The four-company table shows eligibility, tracking, repeat events, undecided decisions, escalation drafts due, overdue follow-ups, prepared local packets and stale records. Company switching keeps records separated.

## Conditions and audit behavior

1. Each case requires a current, prepared QL-221 source and at least one refreshed gap. A local QL-222 replay starts with zero events and no acknowledgments.
2. For each gap, a fictional recurrence type and an unsent owner follow-up disposition must be recorded with a non-empty fictional note. Selecting **Repeated after refresh** counts one new event per gap per simulated cycle, even if the note is edited repeatedly. Counts remain synthetic; previous QL-218 counts are included only for local comparison.
3. A gap with any earlier or new recurrence needs a **draft independent escalation** before packet preparation. Advancing three cycles without a new per-gap decision marks that follow-up overdue and prevents local packet preparation; the operator may update the decision locally.
4. Three explicit acknowledgments document source provenance, owner handoff boundaries and all twelve QL-181 holds. A locally prepared packet locks further simulated changes; it is **not** an approval or sign-off.
5. A revised QL-221 source token or upstream stale evidence freezes the previous QL-222 packet and its actions. The operator must acknowledge an explicit **case-only reset** to restart with the revised prepared source. Other cases and companies remain unchanged.
6. The fixed-shape local receipt contains only coded statuses, counts and QL-181 held states. No free-text notes, source tokens, reviewers or customer details appear in the receipt.

## Invariants

- All **12 QL-181 prerequisites** must remain `HELD_UNVERIFIED`; conditional pilot release remains `BLOCKED`.
- `actualIndependentReview`, `actualOwnerDecision`, `actualClosure`, `livePilotReady` and `providerConnected` are false. No simulated recurrence can lift a hold or certify real closure.
- No provider calls, SMS, database mutations, customer notifications or uploads. The state is volatile React state and disappears on page reload.
- Software CI/deployment passing does **not** imply that an independent reviewer accepted real evidence or authorized communications.

## Verification

Run in `app/`:

```sh
npm run check
npm test -- --run
npm run build
npm run pages:build
```

Model and UI tests cover four-company isolation, recurrence de-duplication, escalation and aging rules, source-change freeze/reset, redacted receipts, hold continuity and the operator workspace. CI and the served production bundle marker must both be verified after the `dev` and `main` promotions.

Release marker: `ql222-four-company-evidence-refresh-exception-recurrence-owner-decisions-hold-recheck-disabled-preview-v1`.
