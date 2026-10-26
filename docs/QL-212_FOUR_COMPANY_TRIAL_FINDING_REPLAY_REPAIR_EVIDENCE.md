# QL-212 — Four-Company Trial Finding Replay & Repair Evidence Queue

Release marker: `ql212-four-company-trial-replay-repair-evidence-disabled-preview-v1`.

## Intent

QL-212 adds a guided, **in-memory preview repair queue** downstream of QL-211 owner/operator-observed trial gaps. A new session has no findings and no queue items; the app never manufactures a real owner observation. The queue is accessible for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. `dev`/`main` production checks can become GREEN without claiming that any real owner completed a trial or resolved an issue.

All QL-181 **12 live-pilot prerequisites remain HELD_UNVERIFIED**. This release has no real calls, SMS/MMS, provider requests, payment/billing, customer records, backend writes, owner identity attestations or independently executed closure. Notes are **fictional, local to the open app session** and vanish on reload. Never enter real customer information.

## Guided flow

1. In **Owner trial & gap triage** (QL-211), a person explicitly records `Observed gap` or `Could not complete` on one of the ten manual scenarios for a company. A `Not run` or `Observed pass` scenario does not produce a QL-212 finding.
2. Open **Finding replay & repair queue**. The four-company aggregate shows only open QL-211 findings, queue drafts and stale source records. Only the selected company's finding details are available.
3. Choose a finding and **Add to repair evidence queue**. This creates a browser-session entry linked to the exact source observation version.
4. **Run safe replay check**. Eight scenario classes invoke their corresponding QL-210 fixed fictional contract checker. A passing result is `SYNTHETIC_CONTRACT_PASS`, meaning the existing mock policy baseline remains sound—not that the reported UI issue reproduced, a code repair occurred or the issue is closed. Keyboard and mobile/zoom findings return `MANUAL_REPLAY_REQUIRED`. Ten most recent replay result codes are retained for that local item.
5. Enter a fictional **repair evidence draft** and perform at least one safe replay; only then is **Request manual retest** available. This is a request, not a dispatch or scheduled appointment.
6. After a separate human *preview* retest, optionally record `Pass observed · unverified`, `Still fails`, or `Retest blocked`. No option closes the QL-211 finding, grants pilot readiness or records legal owner approval.
7. Any change to QL-211's underlying source note, area, severity or observation state invalidates the old repair draft. A stale draft is frozen. An explicit two-step **Refresh** discards the stale local plan and replay record for that single company/scenario; other companies are unaffected.
8. Optionally copy the **status-only** JSON receipt. It omits free-text notes, owner identities, source fingerprint and personal identifiers, and carries the explicit `pilot: HELD` / `independentClosure: false` fields.

## Automated acceptance

- Empty QL-211 observations mean an empty QL-212 queue across all companies.
- No arbitrary injected scenario can be queued. All mutation methods require a current company-specific QL-211 gap or blocker and a matching source fingerprint.
- QL-210 replay is deterministic, synthetic and non-networked; manual-only keyboard/mobile scenarios never show automated pass.
- Repair retest requires an explicit queued item, an 8-character-minimum draft and a prior safe replay result. State transitions are one-way; the queue never permits independent closure.
- Stale sources freeze replay, planning and retest until explicitly refreshed.
- Company switching isolates case details, notes, repair state and receipts. Receipts contain only fixed-schema codes.
- All 12 QL-181 holds, no actual owner approval, `pilotReady: false`, zero calls/SMS and zero external writes survive every replay and retest state.
- TypeScript, full Vitest suite, application build, Pages build, green PR checks, `dev` merge, `main` merge, all five exact-main production checks, `dev`/`main` content parity and served release marker are the promotion gates.

## Next proposed build

**QL-213 — Four-Company Repair Retest Comparison & Independent Review Preparation.** Pair each local trial finding with before/after mock check receipt comparisons, a structured independent-review checklist and unverified closure-risk assessment. The real-pilot and independent-approval holds remain in force; no review status can be inferred from synthetic evidence alone.
