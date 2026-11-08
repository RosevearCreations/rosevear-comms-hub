# QL-379 — Owner Incident Session Review Shortcuts

Four accessible buttons let an authenticated owner review all observations, currently displayed action alerts, all currently displayed alerts, or observations no longer displayed. Each shortcut clears the search, resets grouping to the original safe default, and clears the prior detail selection.

The shortcuts are intentionally in-memory, non-authorizing views over existing QL-377/378 observations. They do not persist, acknowledge or resolve incidents, perform fresh source checks, or convert an aggregate into six independent confirmations. Logout or role changes reset the review state. The protected refresh remains the source of new aggregate evidence.

Verification: `node --test scripts/__tests__/ql379-owner-review-presets.test.mjs` plus existing QL-377/378 UI and safety tests.
