# QL-224 — Four-company overdue follow-up escalation replay, evidence reconciliation and independent hold continuity

## Disabled-preview scope

This build extends the QL-223 locally prepared owner-decision aging packet for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. It adds the **Overdue escalation & hold continuity** operator workspace and a separate browser-session-only QL-224 ledger. No real customer, owner, reviewer, carrier, database or messaging system is contacted.

## Fictional review workflow

1. A case can start only when its QL-223 source is current, prepared and contains at least one fictional evidence gap. The QL-224 case starts without reconciliation decisions, checks or simulated history.
2. Every gap gets an invented evidence comparison (`STILL_OPEN_UNVERIFIED`, `FICTIONAL_EVIDENCE_MATCHED_UNVERIFIED` or `FICTIONAL_SOURCE_CONFLICT`) and an **unsent** escalation route. The portfolio displays all four companies' open items, invented source conflicts, referrals due and retained overdue events.
3. Advancing a simulated cycle ages each recorded follow-up. Two untouched cycles means **due soon**; three or more means **overdue**. Refreshing an overdue gap requires `REFER_INDEPENDENT_DRAFT`. That refresh records a retained historical overdue escalation, even though the current age resets to zero. Nothing is actually dispatched.
4. A P0 gap, earlier synthetic recurrence, current source conflict or historical overdue escalation requires an unsent independent referral before local packet preparation. Synthetic conflict events increment at most once per gap per cycle, even when a note is edited repeatedly.
5. Three acknowledged **UNVERIFIED** checks cover aging and overdue replay, evidence source reconciliation and all twelve QL-181 held prerequisites. Local packet preparation requires every gap classified, no currently overdue gap, required draft referrals and the unchanged twelve held prerequisites. A prepared local packet locks edits; it cannot approve real release.
6. Any changed QL-223 gap decision, note, recurrence count or upstream evidence freezes the previous QL-224 case. A clearly confirmed **case-only reset** is required to start from a revised current source. Other cases and companies remain intact; orphaned cases stay held and unclosed.
7. The receipt contains coded gap outcomes and synthetic counts only. It omits notes, people, source fingerprints and other private content.

## Release safety invariants

- Exactly twelve QL-181 prerequisites remain `HELD_UNVERIFIED`, and conditional release remains `BLOCKED`.
- Real independent closure, evidence verification, owner authorization and provider/pilot readiness remain false.
- There are no live calls, SMS, callbacks, backend writes, Supabase schema changes or customer notifications.
- A passing software deployment does not authorize a real communications pilot or independent closure.

## Validation

From `app/`, run `npm run check`, `npm test -- --run`, `npm run build` and `npm run pages:build`. Integration tests extend the complete synthetic QL-211→QL-223 chain to test overdue escalation history, referral gating, age transitions, once-per-cycle conflict counting, explicit stale source reset, company isolation, privacy-minimized receipts, operator UI and all 12 release holds. After `dev` and `main` merges, check exact main CI, Pages deploy and the live release marker:

`ql224-four-company-overdue-follow-up-escalation-evidence-reconciliation-independent-hold-continuity-disabled-preview-v1`.
