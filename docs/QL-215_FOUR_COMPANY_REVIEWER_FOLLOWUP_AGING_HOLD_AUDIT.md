# QL-215 — Four-Company Reviewer Gap Follow-Up Aging, Source Reconciliation & Release Hold Audit

Release marker: `ql215-four-company-reviewer-gap-aging-source-hold-audit-disabled-preview-v1`.

## What changed

The four-company Quo-lite operator console adds a **browser-session-only** follow-up desk after QL-214. It is available for Rosie Dazzlers, Devil n Dove, iCamp and YW · Property Maintenance, but shows zero manufactured cases when no owner/operator trial has been reported.

To start tracking a case, the company must have a QL-211 reported gap, QL-212 fictional repair/retest, QL-213 prepared comparison packet, and QL-214 **locally prepared fictional handoff** with at least one gap. The app never treats these as actual independent acceptance or real owner identity proof.

## Simulated follow-up aging

- The new counter begins at **simulated review cycle 0**. A person explicitly advances it by clicking a button; it does not use the current date, silently schedule appointments, send reminders or represent elapsed real time. Capped at twenty demonstration cycles per case.
- Each QL-214 gap category has its own `lastReviewCycle` and fixed review-action code. Every gap remains **open and unverified**.
- After one unattended cycle a gap enters `WATCH_CYCLES`. P0/P1 gaps reach `ESCALATION_REVIEW_DUE` after three unattended fictional cycles; P2/P3 after five.
- Recording a local fictional follow-up, reference recheck or escalation draft resets that category's unattended-cycle count. It does **not** reset the case's total simulated review cycle, close the evidence gap, notify a reviewer or satisfy a policy hold.
- Any change to the underlying QL-211/212/213/214 evidence makes the case stale, freezing cycle and note changes. Refreshing a current QL-214 source requires an explicit confirmation that resets just that local QL-215 case's simulated cycles and drafts. Withdrawn source findings remain counted as orphaned stale evidence.

## Hold continuity

The read-only QL-181 register checks all **twelve** real-pilot prerequisites are still `HELD_UNVERIFIED`; none can be approved or dismissed. There is no live call/SMS/MMS, provider, account-authentication, customer-data, external message, external write, independent-signoff or actual owner authorization code path. A software-production GREEN means only that the build and deployment gates passed.

The optional per-company receipt includes only safe status codes, simulated counters, review action enums, and hold outcomes. It contains no free-text observations, reviewer aliases, source hashes, private contact details or authentic owner decisions.

## Acceptance gates

- No upstream QL-214 locally prepared handoff means no active QL-215 case.
- No automatic time elapses; aging only advances by explicit bounded user actions.
- P0/P1 and P2/P3 escalation thresholds are deterministic and independently testable.
- A follow-up action resets only its own unattended-cycle counter while leaving every evidence gap open.
- Company context, stale-source detection, withdrawn-case counting, receipts and all twelve prerequisite holds are tested.
- Full TypeScript, complete test suite, application and Pages build, GitHub `dev`→`main` checks, branch file parity and served release marker establish deployment readiness.

## Next proposed build

**QL-216 — Four-Company Escalation Review Replay & Owner-Safe Handoff Packet Audit.** Add fictional escalation review packets, source-linked exception diffs and follow-up handoff audits, while retaining every independent-authorization and real-pilot hold.
