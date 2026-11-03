# QL-319 — Admin Preferences, Saved-View Recovery, Shortcuts & Contextual Help Finish

## Delivered disabled-preview software

- Added a real **Operator settings & recovery** panel to all four command screens: layout profile and density, four-view navigation, seven keyboard shortcut references, per-view help, schema-validated saved-view audit/restore, read-only sanitized layout export, and a two-step reset confirmation that can be cancelled without overwriting local layouts.
- The feature reuses existing QL-272/273/300 versioned `rosevear-comms-hub:ql272-command-layouts:v1` browser-local layout storage. It adds **no second preferences store**; the existing **Customize cards** editor still controls card ordering, visibility, role-display preview and profile naming.
- Missing, malformed, invalid or storage-unavailable records fall back to safe Standard display. Restoring is disabled for all but the exact validated v1 record. Export is human-readable, manual, read-only and schema-filtered—no automatic file, clipboard, upload, account sync or import operation.
- Modern navy/purple/teal graphical cards, explicit status text, native labeled controls, keyboard focus, mobile reflow, reduced-motion and forced-colour treatment. The [operator acceptance walkthrough](../QL-319_ADMIN_PREFERENCES_SAVED_VIEW_HELP_GUIDE.md) describes each manual check.
- Every profile role is a **display-only preview** and never a signed-in identity, administrator grant or consent. No new password vault, secret field, tenant/private data, real message, employee assignment, call, SMS, dispatch, provider configuration or connection was introduced.

## Tests and exact source

- `npx vitest run --silent --reporter=dot`: **137/137 test files, 1,237/1,237 tests PASS**.
- QL-272/273/291/300/319 focused run: **4/4 files, 33/33 tests PASS**. QL-319 extended run: **8/8 tests PASS**, including local-storage denial, corrupt saved-view rejection, reset cancellation, sanitized export and accessible shortcuts.
- `npm run check` and `npm run build`: **PASS**, 554 Vite modules, known large-bundle warning; no functional regression.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**, 366 source files scanned, `raw-network: 0`, `supabase-mutation: 0`, live calls/SMS/real owner approvals disabled. This is a static sink scan and not a security penetration test.
- Local source commit `3b8a2e353c8444f8f092f5093f6e3624b723e377`; the GitHub-created source tree matched local SHA `36bd078876f0cc8c58f1f1ac14ab4ad0e7543876` exactly. Pushed source to `dev` commit `d5d7d3390fc4cccf6e0ba7e80197e6620eb33d3d`.
- [Code PR #612](https://github.com/RosevearCreations/rosevear-comms-hub/pull/612) merged as exact code `main` commit `343c7e9307e9b9eeb4a4bf71cfd718e42bcc6506`.

## Exact-main deployment and live Worker

**Software Production GREEN:** all five checks at `main` commit `343c7e9307e9b9eeb4a4bf71cfd718e42bcc6506` concluded **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`.

Public Worker: https://rosevear-comms-hub.devilndovelive.workers.dev/ — its live HTML referenced the QL-319 assets below. Full HTTP-fetched assets had the exact local build hashes:

| Published asset | Local and live SHA-256 | Verification |
| --- | --- | --- |
| `index-B9XJK16K.js` | `fb8d7cd09348a42fead3a36ef4ecb23df16279b361dac9593157e17b77594c83` | Byte-identical |
| `index-J4ReSSIL.css` | `da38a106fca0ccbc1fa789ef42cae55480a94eccb5e5eaa4d90aab8390df4ac3` | Byte-identical |

The code release and byte-match confirm **disabled-preview software publication only**. Owner physical-device and screen-reader acceptance, authenticated role verification, independently signed source Proof-B and actual external provider integration remain **unverified/unperformed**. The six-app gate remains `DISCONNECTED / HOLD`; ACK Delivery Evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## Queue handoff

QL-319 is the **ninth of twenty Production GREEN disabled-preview builds**, leaving **eleven**. **Next planned: QL-320 — Accessible Front-End Journey, Recovery States & Final Operator Visual Sweep.** It is not automatically started. No owner acceptance or external integration authorization is inferred from deployment GREEN.
