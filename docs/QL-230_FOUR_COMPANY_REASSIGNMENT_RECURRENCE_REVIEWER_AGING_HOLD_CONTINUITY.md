# QL-230 — Four-Company Reassignment Follow-Up Recurrence, Reviewer Decision Aging & Conditional Hold Continuity

Status: **disabled preview**. This release adds a session-only operator workspace that builds on locally prepared QL-229 fictional reassignment evidence. It makes no claims of actual independent reviewer verification, owner authorization, customer contact, or pilot-readiness.

## Workflow and guarded transitions

1. Select a company (Rosie Dazzlers, Devil n Dove, iCamp or Yard Workers), then **Reviewer recurrence & hold continuity**.
2. Only a current, locally prepared QL-229 reassignment case with evidence gaps can start a new QL-230 review. Source provenance is bound to the QL-229 packet, its checks, gap outcomes and fictional notes.
3. Each evidence gap needs a fictional recurrence/follow-up outcome, an **unsent** independent reviewer decision and a meaningful synthetic note. Repeated exceptions are counted at most once per gap per simulated cycle.
4. Reviewer decisions are **due soon after two simulated cycles** and **overdue at three cycles**. An overdue decision can only be refreshed through a *separate-reviewer referral draft*. Historical late decisions remain recorded even after refresh.
5. Inherited high-priority, disputed or recurring gaps also require a separate-reviewer referral draft. Three local UNVERIFIED review acknowledgements and all twelve actual QL-181 holds are prerequisites for preparing the local audit packet.
6. A change to upstream QL-229 reassignment evidence freezes the dependent case. Operators may explicitly reset only that company's stale fictional case; other companies are unchanged. Removed/orphaned cases stay held.

## Privacy and release protections

- No live calls, SMS/MMS, integration dispatch, data synchronization, Supabase writes or real reviewer contacts.
- All four companies remain isolated; receipt exports include only coded fictional statuses and hold counts, never private notes, source fingerprints or reviewer identities.
- Twelve real QL-181 prerequisites remain `HELD_UNVERIFIED`. Conditional pilot release is `BLOCKED`, regardless of local review packet completion.
- GREEN production CI means *software deployment passes*, not that a live communications pilot has been authorized.

## Verification

The QL-230 regression extends the QL-211 through QL-229 synthetic source-chain tests with four-company eligibility, age thresholds, overdue referral enforcement, recurrence idempotence, per-company stale-source freezes, privacy-minimized receipts, navigation and interactive preparation. Run `npm run check`, `npm test -- --run`, `npm run build`, and `npm run pages:build` from `app/` before promotion to `dev` and `main`.
