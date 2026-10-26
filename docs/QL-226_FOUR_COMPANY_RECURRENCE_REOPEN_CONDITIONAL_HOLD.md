# QL-226 — Four-company independent evidence disposition recurrence, owner follow-up reopen and conditional release hold recheck

## Disabled-preview scope

This build follows QL-225 for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. It adds the **Independent recurrence & owner reopen** operator workspace and an isolated, browser-session-only QL-226 synthetic ledger. It does not alter a backend, provider, carrier, database, Supabase policy or real release status.

## Fictional recurrence and owner follow-up

1. Only a current, locally prepared QL-225 evidence-disposition packet containing gaps can begin a QL-226 review. Every gap starts with no new decision; no real reviewer is assumed to have approved or even received it.
2. Operators record `MONITOR_OPEN_UNVERIFIED`, `REOPENED_EXCEPTION_UNVERIFIED` or `SIMULATED_RECHECK_RECORDED_UNVERIFIED` plus an **unsent** owner follow-up route. Reopened events are counted once per gap and simulated cycle, including after further edits or refreshed monitoring outcomes.
3. Follow-up age increases by synthetic cycle. Two untouched cycles means due soon; three or more means overdue. Refreshing an overdue gap requires an unsent independent referral, preserves historical overdue follow-ups and resets only the current simulated age.
4. Any inherited P0 priority, recurrence, prior overdue escalation or evidence discrepancy, newly reopened item or overdue episode requires an unsent independent referral before a local packet can be prepared. It is never a real external communication.
5. Three local, explicitly **UNVERIFIED** acknowledgements cover independent disposition recurrence, owner follow-up reopening/aging and the conditional release hold recheck. Packet preparation requires a current QL-225 source, classified gaps, no currently overdue items, no required referral missing, complete checks and all twelve actual QL-181 holds intact.
6. Any changed QL-225 decision or upstream evidence freezes the previous QL-226 review. A separately confirmed **case-only reset** can restart an eligible case from a new source; no other company or case is touched. Orphaned and ineligible records remain held.
7. Redacted status receipts contain coded outcomes, simulated aging and recurrence counts, and QL-181 hold states only; notes, identities, source fingerprints and real customer details are excluded.

## Release safety invariants

- Exactly twelve QL-181 prerequisites remain `HELD_UNVERIFIED`. Conditional real pilot release is always `BLOCKED`.
- Real independent recheck, verified evidence and owner authorization are **false** despite a locally prepared packet.
- No calls, SMS, provider sends, backend writes, customer notifications, Supabase schema changes or live pilot activation.
- Production GREEN proves a successful software deploy; it does not release these real-world holds.

## Verification

From `app/`, run `npm run check`, `npm test -- --run`, `npm run build` and `npm run pages:build`. Regression tests cover QL-211→QL-225 synthetic source integrity, company isolation, recurrence event de-duplication, aging and independent referral gating, stale source freeze/reset, redacted receipts, packet-lock behavior, accessible operator navigation and the twelve actual held prerequisites.

After `dev` and `main` promotion, verify exact-main CI, Pages build/deploy and the canonical production asset marker:

`ql226-four-company-independent-evidence-disposition-recurrence-owner-follow-up-reopen-conditional-release-hold-recheck-disabled-preview-v1`.
