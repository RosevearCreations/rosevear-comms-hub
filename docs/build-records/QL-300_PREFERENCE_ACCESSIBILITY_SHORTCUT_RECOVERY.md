# QL-300 — Preference Accessibility, Shortcut Discoverability & Saved-View Recovery Acceptance

## Application delivery

- Added a collapsible accessibility acceptance guide to all four command views (IT, Management, Analytics and Status).
- Four manual check cards cover keyboard shortcut discovery, reduced motion, forced-colors/high contrast with text reflow, and saved-view refresh/recovery. Each defines reproduction steps and expected outcomes without claiming actual owner or assistive-technology acceptance.
- Surfaced the existing seven QL-273 keyboard shortcuts in a labeled reference, kept the control keyboard operable and verified focus stays on the recovery action.
- Reused the existing reviewed QL-272 browser-local layout format; no additional key, private customer data or persistence mechanism was introduced.
- Hardened the saved-view writer to reject invalid schema versions, extra fields, role forgery, malformed profile values and oversized records **before writing**. Existing read-time recovery still detects direct local-storage tampering and restores only validated layouts.
- No real calls, SMS, dispatch, private gateway GETs, tenant reads or external mutation. Six integrations remain `DISCONNECTED / HOLD`; ACK delivery remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## Validation

- TypeScript check, all 1,123 tests across 117 app test files, operator security baseline (1/1), and Vite build of 506 modules passed.
- Test coverage includes invalid persistence rejection, direct browser-storage tampering, missing/malformed/unavailable storage, verified recovery, keyboard shortcut reference, stable focus, mobile reflow, forced-colors and reduced-motion styles.
- Feature source tree `47a6ebb73559429a463410f3897a8ff3a782553a` advanced through `dev` and [PR #573](https://github.com/RosevearCreations/rosevear-comms-hub/pull/573) to `main` code commit `aa0fea176dd472e932e59e3d3a5f50574ff834c0`.

## Production gate

**Verified Production GREEN:** all five exact-main checks succeeded on code commit `aa0fea176dd472e932e59e3d3a5f50574ff834c0`: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`.

Public Worker `https://rosevear-comms-hub.devilndovelive.workers.dev/` served JS `index-ChBS401z.js` SHA-256 `a55aa1f332b56e7d2e400fc0f4668c77c48f351cde7869eccc9806b57bdea25a` and CSS `index-D3Xy1sP8.css` SHA-256 `13a049ce5e652cfd5df9ffb8d71aa54f607545404c8ce22672b6dc65aaf03698`, both byte-identical to the tested build.

**Next after verified GREEN:** QL-301 — Management Command Dashboard, Ownership Workload & Incident Status Cards.
