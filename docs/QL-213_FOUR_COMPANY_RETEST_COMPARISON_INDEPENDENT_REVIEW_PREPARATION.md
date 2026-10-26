# QL-213 — Four-Company Repair Retest Comparison & Independent Review Preparation

Release marker: `ql213-four-company-retest-comparison-independent-review-prep-disabled-preview-v1`.

## Purpose and boundary

QL-213 provides an **in-memory, fictional four-company** review preparation workflow downstream of QL-211's manually reported gap and QL-212's replay/repair/retest record. It does **not** attest that anyone has performed real trial observations or that a real code fix was made. The twelve QL-181 real-pilot prerequisites remain `HELD_UNVERIFIED`. No provider calls, SMS/MMS, real customer records, account authorization, backend writes, owner identity proofs, independent approval or actual closure occur. A green deployment is not a green real-pilot decision.

The four company contexts are Rosie Dazzlers, Devil n Dove, iCamp and YW · Property Maintenance. A new browser session has **zero** observations and **zero** comparison drafts. None are seeded or inferred. The UI never sends work to a reviewer; inputs disappear on reload and must contain fabricated descriptions only.

## Owner/operator walkthrough

1. In QL-211, the person reports a `Gap` or `Blocked` result for one manual scenario.
2. In QL-212, they queue the finding, run one local QL-210 mock check (or receive `MANUAL_REPLAY_REQUIRED`), write a fictional repair plan, request a retest and explicitly record the unverified human retest outcome.
3. Open **Retest comparison & review prep**. Choose that same company's case. Only a current QL-212 entry that has at least one replay and a final human-noted retest status is eligible.
4. **Begin comparison** takes the latest QL-212 replay as `before`, preserving its sequence and disposition; it makes no claim about a source code fix. Return to QL-212 and run a **new** mock replay, then come back and **Capture latest run as after**. Reusing the same run is rejected.
5. The side-by-side comparison shows `AFTER_RUN_MISSING`, `UNCHANGED_SYNTHETIC`, `CHANGED_SYNTHETIC` or `MANUAL_ONLY`. Even a matching synthetic PASS cannot establish that a reported bug was repaired. Keyboard and mobile cases stay manual-only. Failed or blocked self-reported retests remain unresolved.
6. Prepare five independent-review checklist drafts: original gap provenance, actual repair claims, comparison limitations, human/accessibility retest, and cross-company safety/consent/authorization holds. Each draft or follow-up requires an eight-character-minimum fictional note. A `PREPARED_FOR_REVIEW_UNVERIFIED` status means only all local preparation fields are filled with a passing self-report and a new replay. It is **not** a review or signoff.
7. Source QL-211 edits, QL-212 version changes, and withdrawn findings invalidate or orphan earlier comparison drafts. Stale drafts cannot advance; replacing one requires confirmation and resets the current case's local review checklist. Other companies remain isolated.
8. The optional fixed-schema receipt contains only scenario/status/checklist codes; it excludes observation text, repair notes, review free text, fingerprints and personal/customer identifiers. Nothing is uploaded automatically.

## Acceptance assertions

- Zero source gaps produce zero QL-213 cases; a missing QL-212 retest cannot start one.
- `before` captures a specific QL-212 replay; `after` requires a strictly greater replay sequence. Duplicate captures do not advance.
- Manual-only mocks do not produce an automated verification pass. Matching synthetic passes do not assert actual repair, independent closure or real-pilot readiness.
- A failed/blocked retest cannot become a prepared packet by checklist completion.
- Blank review notes cannot be marked prepared; missing checklist sections and explicit follow-ups remain visible.
- Changes to upstream observation/repair states freeze prior review drafts and require owner-controlled replacement.
- Organization contexts isolate cases and notes; withdrawn cases are counted as stale, never silently closed.
- All 12 real-pilot prerequisites and all zero-call, zero-message, zero-write constraints remain intact.
- Full automated tests, TypeScript, app/Pages build, dev/main PR checks, exact-main production checks, branch parity and served marker establish **software deployment** health only.

## Next proposed build

**QL-214 — Four-Company Independent Review Intake, Evidence Gaps & Conditional Release Hold Register.** Provide a fictional reviewer intake checklist, review-gap ownership and a no-shortcut release hold register. Keep `independentApproval: false`, live provider operations disabled and the twelve prerequisite holds until genuine external evidence and authorized decisions exist.
