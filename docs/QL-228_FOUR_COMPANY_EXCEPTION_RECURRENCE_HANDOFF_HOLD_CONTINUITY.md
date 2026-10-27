# QL-228 — Four-Company Owner Evidence Exception Recurrence, Independent Handoff Follow-Up & Conditional Hold Continuity

## Outcome

Add a dedicated disabled-preview Operator workspace **Evidence recurrence & handoff continuity**, directly downstream from QL-227 owner evidence audit. It supports Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers with distinct in-browser organization/case ledgers. All outcomes are fictional rehearsal entries; this is not a live independent review system.

## Audit contract

1. A QL-227 case must have a current source revision and a locally prepared held-audit packet before QL-228 can start. Its source fingerprint includes the QL-227 reconciliation, owner decision, checks, cycle and synthetic note content. A changed or removed source freezes the QL-228 case. Only an explicit current-source **case-only reset** can clear its local history; other companies are preserved.
2. Each gap receives a fictional evidence exception classification, an **unsent** independent handoff decision, and a short private rehearsal note. Simulated recurring exceptions are counted once per gap per cycle, and historical event counts persist across same-case follow-up edits.
3. Simulated handoff aging is due soon after two cycles and overdue at three. Late follow-up cannot be recorded unless it is an unsent independent reassignment draft. A P0 gap, inherited independent-review risk, an invented recurring exception or a historical late handoff requires the independent handoff route. No recorded exception represents real evidence verification.
4. Preparation is blocked until every gap is reviewed, all required independent handoff drafts exist, no active overdue item remains, and all three local checklist items are acknowledged **UNVERIFIED**. All twelve QL-181 actual prerequisites must still be `HELD_UNVERIFIED`.
5. Four-company summaries show eligible cases, tracking, unreviewed gaps, recurrence events, due soon/overdue handoffs, historically overdue follow-ups, handoffs due, local packet readiness and stale cases. Orphaned cases remain held.
6. The exportable local receipt contains coded statuses/counters and actual hold states only. It omits free-text notes, source fingerprints and reviewer identities. It cannot be used as an owner authorization or independent-review signature.

## Safety and operational boundary

- All work is session-only, synthetic, company-scoped and read-only with respect to providers and Supabase.
- No outbound call, SMS, customer contact, backend mutation, independent reviewer request or live service activation is performed.
- A successful build/deployment makes the **software** production GREEN, not the pilot: twelve actual release prerequisites remain held and real conditional release is **BLOCKED**.
- The UI's `data-ql228-release` marker identifies the production-disabled-preview build, not authorization.

## Verification

- Tests for four-company boundaries and immutable holds; source-current preparation, referral debt, historical overdue and recurrence idempotence; stale source freeze and case-only reset; redacted receipts; accessible navigation, help and UI preparation.
- `npm run check`, targeted and full `npm test -- --run`, `npm run build`, and `npm run pages:build`.
- Promote via passing `dev` PR, separate passing `main` PR, passing exact-main App scaffold CI and GitHub Pages production workflow. Verify live QL-228 bundle marker.
