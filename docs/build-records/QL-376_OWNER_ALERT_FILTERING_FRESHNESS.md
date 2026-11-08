# QL-376 — Owner Shell Alert Filtering, Status Freshness & Accessible Incident Review

The QL-374/375 personal operator entry now includes an I.T. incident review with category filters (security, status freshness, connections), human-readable severity, a keyboard-focusable incident detail, an accessible count announcement and a safe link back to the AAL2-protected refresh. This screen never acknowledges, dismisses or writes incidents, authorizes enrollment or checks individual app connections.

## Truth and freshness

- The only source of evidence remains the QL-370 **aggregate** six-shell server readback, scoped to the individually authenticated owner and AAL2. No per-app probes are invented.
- Recent means a role-matched readback at most 120 seconds old, with an advance warning from 90 seconds. Over 120 seconds is expired. A timestamp more than 10 seconds in the future produces an explicit clock-discrepancy action rather than a fresh claim.
- Missing, malformed, mismatched-role, unverified-session and stale readings do not certify source health. An existing STOP discrepancy remains highest-severity and fail-closed.
- Source approval, customer access and Private TEST remain **NOT AUTHORIZED**; the earlier archived preflight pages are not reintroduced as release gates.

## Acceptance

- `node --test scripts/__tests__/ql376-owner-alert-freshness.test.mjs`
- `cd app && npm run test -- src/auth/__tests__/ql376OwnerIncidents.test.ts src/auth/__tests__/ql376OwnerIncidentReview.test.tsx`
- `cd app && npm run build`
- `bash scripts/ql336a-required-gates.sh`
- Verify protected `dev` and `main` promotions, required GitHub checks and public Worker JS/CSS hash parity independently before reporting Production GREEN.
