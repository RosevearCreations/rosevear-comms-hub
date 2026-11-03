# QL-312 — Standard Theme Tokens, Graphic Cards, Typography & Visual Consistency

## Delivered software

- Introduced a scoped, reusable Standard Theme layer with a coherent light/dark command palette, six labelled accent colours, shared typography, border, focus, radius, spacing and card-shadow tokens.
- The actual **Front End / Operator, Admin, I.T. / Connections, Management, Statistical and System Status** surfaces now share graphic card treatments and readable labels; dashboard/command KPI borders are cyan, violet, gold and green rather than relying on decorative colour alone. Statistical charts have more legible labels and tracks; status chips preserve literal text.
- Added accessible in-session **Comfortable/Compact** card-spacing and **Standard/High** contrast controls with visible pressed state, keyboard focus, small-screen wrapping and reduced-motion/forced-colours rules. These controls only affect CSS and React session state; the existing QL-272 local layout preferences remain separate and intact.
- Added a text-first **ⓘ Colour & status guide** with six categories and the distinct labels **PREVIEW ONLY**, **DISCONNECTED / HOLD** and **UNDER REVIEW**, plus unchanged QL-311 optional Supabase setup guidance.
- Published a [QL-312 visual-review guide](../QL-312_STANDARD_THEME_VISUAL_CONSISTENCY.md) and a [six-area screenshot comparison capture matrix](../visual/ql312-standard-theme-capture-matrix.json) covering five widths, three zoom values and four visual-state combinations. **Screenshots and physical owner-device acceptance were not performed**; fixtures are a review plan, not independent findings.
- No new external connections, tenants, messages, calls, dispatch, private data, keys, signed proofs or owner approvals. All six supporting-app integrations remain `DISCONNECTED / HOLD` and ACK evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## Tested source and release evidence

- `npm run check`: **PASS**.
- Focused visual/layout tests: **18/18 PASS** across QL-312 and the historical QL-291 command-layout suite.
- `npm test -- --reporter=dot --maxWorkers=2`: **130/130 files and 1,179/1,179 tests PASS**. Preexisting React duplicate-key warnings from older preview fixtures remain unrelated to this release.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**; source scan reports zero Supabase mutations and raw-network sinks, with real calls/SMS/owner approvals disabled. Not a runtime security audit.
- `npm run build`: **PASS**, **539 modules**. The existing JavaScript bundle-size warning persists; no claim of bundle-size remediation is made.
  - JS `app/dist/assets/index-gSkNU37b.js` SHA-256 `5147717a5b2727d32b23e61109448a34fb9b3e886928dbaa7d9399e76b99ef3b`.
  - CSS `app/dist/assets/index-BqyLMuRK.css` SHA-256 `3891c445598436279a71f1dc13fc6773ce0030fcacb695503b0fc17d976f0766`.
- Promoted source through `dev` and [PR #598](https://github.com/RosevearCreations/rosevear-comms-hub/pull/598) to code `main` SHA `4ae20beb26a4f26b601d8f874e050a21ea2e8bef`.

## Exact-main production verification

**Production GREEN for software code `main` SHA `4ae20beb26a4f26b601d8f874e050a21ea2e8bef`:** All five applicable exact-main checks completed successfully — `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`.

Live public Worker https://rosevear-comms-hub.devilndovelive.workers.dev/ served:

| Live artifact | Live SHA-256 | Tested build comparison |
| --- | --- | --- |
| `index-gSkNU37b.js` | `5147717a5b2727d32b23e61109448a34fb9b3e886928dbaa7d9399e76b99ef3b` | **Byte-identical** |
| `index-BqyLMuRK.css` | `3891c445598436279a71f1dc13fc6773ce0030fcacb695503b0fc17d976f0766` | **Byte-identical** |

The proof confirms a deployed software preview only, not the outstanding manual screenshot, owner device, independent source-proof or operational authorization gates.

## Queue and owner gate

Next queued build is **QL-313 — Responsive Operator Shell, Touch Targets & Device Layout Recovery**, after production verification of QL-312. The QL-311–330 batch is software-only. Following QL-330, another batch requires genuine owner acceptance findings, independent verification and new explicit owner authorization. Production software GREEN never authorizes six-app integration or real sign-off.
