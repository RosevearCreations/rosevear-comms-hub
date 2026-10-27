# QL-231 — Four-Company Reviewer Recurrence Disposition, Overdue Evidence Recheck & Conditional Hold Exception Oversight

Status: **disabled-preview software**. QL-231 extends the locally prepared QL-230 fictional reviewer decision chain. It does not constitute independent verification or release of a communications pilot.

## Source-linked workflow

1. Select Rosie Dazzlers, Devil n Dove, iCamp or Yard Workers in the operator console, then **Reviewer disposition & evidence recheck**.
2. A QL-231 case may start only from a **current, locally prepared QL-230** case with evidence gaps. Its fictional revision token covers the prepared source, checks and category dispositions.
3. For each gap, record a **synthetic evidence recheck**, an **unsent independent reviewer disposition**, an **unsent recheck action**, and a meaningful fictional note. Recurrence is counted once per gap per simulated cycle.
4. After **two** simulated cycles without refreshing a recheck, a disposition is due soon. After **three**, it is overdue and a local overdue escalation draft is mandatory. Historical overdue episodes remain in the local audit record.
5. P0, inherited repeated or late cases require a separate-recheck referral. A fictional recurring exception requires a reopened-exception or independent-review referral disposition. Local packet preparation is blocked until gaps, referrals, three UNVERIFIED checks and all twelve real release holds have been reconciled.
6. Upstream QL-230 edits freeze dependent dispositions. Explicit resets replace one company's fictional case only; orphaned source cases remain held. No cross-company decisions or reviewer identities are shared.

## Safety and privacy

- All **12 QL-181** prerequisites remain `HELD_UNVERIFIED`, and conditional release remains `BLOCKED` for every company.
- No calls, SMS/MMS, provider dispatch, Supabase writes, real owner approvals or independent reviewer contacts occur.
- Exported receipts contain only coded statuses, historical counts and hold states, omitting private notes, source tokens and reviewer identities.
- CI or GitHub Pages **GREEN** verifies the deployed software, never permission to start live communications.

## Verification

The QL-231 regression builds on the entire QL-211→QL-230 synthetic evidence chain and covers company boundaries, readiness guards, invalid status rejection, independent disposition, recurrence idempotence, overdue escalation and history, stale-source freezing, case-only reset, redacted receipts, navigation and interactive packet preparation. Run `npm run check`, `npm test -- --run`, `npm run build`, `npm run pages:build` from `app/` before promotion to `dev` and `main`.
