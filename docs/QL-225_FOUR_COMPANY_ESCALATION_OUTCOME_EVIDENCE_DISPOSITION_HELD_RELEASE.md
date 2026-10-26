# QL-225 — Four-company escalation outcome follow-up aging, independent evidence disposition and held-release reassessment

## Disabled-preview scope

QL-225 extends the locally prepared QL-224 escalation packet for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. The **Evidence disposition & held-release reassessment** workspace introduces an independent, organization-scoped, browser-session-only synthetic ledger. Nothing is communicated to real customers, owners, reviewers, carriers, providers or Supabase.

## Fictional workflow and safeguards

1. A case can start only from a **current**, **locally prepared** QL-224 overdue escalation packet containing evidence gaps. Every gap starts without an independent disposition or owner follow-up draft.
2. Operators stage an invented evidence disposition (`EVIDENCE_PENDING_UNVERIFIED`, `SIMULATED_REVIEW_NOTED_UNVERIFIED` or `SIMULATED_DISCREPANCY_UNVERIFIED`) and an **unsent** follow-up. These are never actual verified evidence or a genuine independent reviewer decision.
3. Each recorded disposition carries a simulated last-reviewed cycle. Two untouched cycles means **due soon**, three or more **overdue**. Refreshing an overdue outcome requires `REFER_INDEPENDENT_DRAFT`; it retains the historical overdue episode even after age resets. No message is dispatched.
4. An inherited P0 priority, synthetic recurrence, earlier QL-224 overdue/conflict or current QL-225 discrepancy requires an unsent independent referral. Invented discrepancy events are counted only once per gap per simulated cycle, even on repeated edits.
5. Three explicitly **UNVERIFIED** checklist acknowledgements cover outcome aging, independent evidence disposition and held-release reassessment. Only a complete source-current case without overdue gaps or referral debt, with all twelve QL-181 holds unchanged, may prepare a local packet. The prepared packet is read-only and authorizes no real closure.
6. Any revised QL-224 source outcome or earlier upstream evidence freezes the QL-225 record. A clearly confirmed **case-only reset** can rebase just that record on a revised current, prepared QL-224 source. It never changes unrelated scenarios or companies; missing-source/orphaned cases remain held.
7. Receipt export is PII-minimized: source-linked coded decisions, simulated cycle ages, counts and hold states only. No note text, person/reviewer details or source fingerprints.

## Release invariants

- All twelve actual QL-181 prerequisites remain `HELD_UNVERIFIED`; conditional release is `BLOCKED`.
- Genuine owner authorization, independent disposition, verified evidence and live pilot readiness are **false**, irrespective of a passing software build.
- No calls, SMS, provider dispatch, external writes, actual reviewer notifications, backend mutations or Supabase schema changes.
- All four companies retain separate cases and draft review state.

## Validation and promotion

From `app/`, run `npm run check`, `npm test -- --run`, `npm run build` and `npm run pages:build`. Contract/UI tests extend the synthetic QL-211→QL-224 chain to cover source eligibility, age boundaries, independent referral debt, overdue history, once-per-cycle discrepancy de-duplication, stale source freeze and case-only reset, brand isolation, privacy-safe receipts, locally prepared packets and immutable holds. After promotion to `dev` and `main`, verify both exact-main CI and Pages deployment and the live release marker:

`ql225-four-company-escalation-outcome-follow-up-aging-independent-evidence-disposition-held-release-reassessment-disabled-preview-v1`.
