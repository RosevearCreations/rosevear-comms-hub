# QL-214 — Four-Company Independent Review Intake, Evidence Gaps & Conditional Release Hold Register

Release marker: `ql214-four-company-independent-review-intake-release-holds-disabled-preview-v1`.

## Scope

Adds an **in-memory fictional review-intake desk** for Rosie Dazzlers, Devil n Dove, iCamp and YW. It links only to a current QL-213 packet marked `PREPARED_FOR_REVIEW_UNVERIFIED`; QL-213 itself requires a QL-211 reported gap, QL-212 fictional replay/repair and human-noted retest, a new after replay, and five prepared checklist drafts. Without that chain no intake is opened.

The new desk is preparation **for** potential independent review, not an independent review. Assigned reviewer roles are labeled fictional, not authenticated identities. A local handoff does not send email, dispatch work, record formal approval or contact external systems. Inputs remain only in React session state and are lost on reload; use made-up examples only.

## Owner-safe workflow

1. Complete QL-211 through QL-213 manual preview steps and draft a five-section comparison packet for an explicitly observed gap.
2. Open **Independent review intake & holds**; select the same company's finding. It is not eligible until all QL-213 preparation requirements are current.
3. **Begin fictional independent-review intake** with zero pre-filled reviewer assignments or evidence claims.
4. Pick an illustrative reviewer *role* (not a name or validated account); describe an eight-character-minimum fictional handoff scope.
5. Record one or more category-specific evidence gaps with priority, fictional detail and a status. Valid statuses remain `OPEN_UNVERIFIED`, `FOLLOWUP_PLANNED`, or `REFERENCE_DRAFTED_UNVERIFIED`. There is deliberately **no verified/closed status**. Repeating a category edits its current local draft without increasing the gap count.
6. **Prepare local handoff** becomes available only after a simulated role is selected, a meaningful scope and at least one gap are provided, and each gap has a follow-up plan or unverified reference. This freezes its local draft and still makes no external request. No independent reviewer acceptance is inferred.
7. Review all **twelve read-only QL-181 release prerequisites**, each showing `HELD_UNVERIFIED`, for any company regardless of gaps or handoffs. QL-214 cannot clear them or authorize a live pilot.
8. Changes to QL-211, QL-212 or QL-213 sources mark the local intake stale. A stale packet cannot advance; an explicit confirmation discards the current case's fictional intake in order to start from a current QL-213 source. Withdrawn source findings remain counted as orphaned stale cases, not closed.
9. Copy an optional fixed-schema, status-only receipt: it contains no free-text observation, repair, intake or gap notes, no reviewer alias, no upstream token and no personal/customer details.

## Required invariants

- New session starts with zero findings, intakes, handoffs or gaps, not fictitious owner attestations.
- Four companies have separate case/gap state; cross-company UI switching never merges data.
- No intake without a QL-213 local ready-for-review packet. A synthetic PASS is not an actual repair verification.
- No packet handoff without a fictional role, scope and gap follow-up; no packet status is approval or closure.
- Upstream source changes freeze edits and local handoff operations; case removal is never treated as resolved.
- QL-181's 12 prerequisites cannot be edited. All real pilot, owner identity, independent verification, customer consent, live provider and data writes remain held.
- All public status receipts are fixed codes with no free text or local source token.
- Only TypeScript, full test suite, app/Pages builds, exact dev/main checks, branch parity and served release marker may establish **software deployment** GREEN.

## Next proposed build

**QL-215 — Four-Company Reviewer Gap Follow-Up Aging, Source Reconciliation & Release Hold Audit.** Add local fictional follow-up windows, owner-safe aging classifications, source-version reconciliation and hold-continuity audit, preserving the no-dispatch/no-approval policy.
