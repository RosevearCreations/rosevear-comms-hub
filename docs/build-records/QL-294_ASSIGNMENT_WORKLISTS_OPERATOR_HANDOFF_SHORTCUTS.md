# QL-294 — Assignment Worklists, Operator Handoff Summaries & Accessible Command Shortcuts

**Scope:** complete the operator’s simulated assignment workflow on the existing QL-194 task queue. All four company contexts are fictional and separate. Six app integrations stay **DISCONNECTED / HOLD**; ACK Delivery Evidence stays **UNDER_REVIEW / PARKED_FOR_LATER**. This build does not send messages, dispatch field work, notify staff, process real contacts or record a signed handoff.

## Delivered behavior

1. **Six worklist lanes:** all work, due/overdue, selected fictional owner, needs owner, waiting/blocked and completed. Each count comes from the active company’s queue state, not hard-coded KPI totals. Urgency is a deliberately illustrative overdue/today **window**, never an actual date or promise.
2. **Deterministic state changes:** sample owner, status, due, priority, task creation and completion/reopen reuse the validated QL-194 reducer and its session-only receipts. Invalid task IDs, cross-business owners and missing conversation links are rejected.
3. **Structured handoff preview:** choose only a roster-listed fictional recipient and one of four approved next steps. A local, **UNSENT** summary reads from the selected company’s synthetic task and channel, with no free-text storage or customer data export. Completed tasks cannot create a new handoff.
4. **Stale-preview protection:** a handoff captures the five-field task version; an owner/status/due/priority change makes the existing preview **OUTDATED** until the operator deliberately prepares a replacement. No staff notification or delivery receipt is implied.
5. **Keyboard discoverability:** `Alt + Shift + Q` opens the queue from any workspace; while the queue is open `Alt + Shift + F` focuses its search, `Alt + Shift + J` focuses the first visible assignment, and `Alt + Shift + K` toggles inline help. `Tab`, `Shift + Tab`, `Enter`, `Space` and existing command help remain available. No shortcut fires from input, select, textarea, contenteditable or a textbox, while composing, or with Ctrl/Meta.
6. **Accessible presentation:** native labelled selections, status regions, clear selected states, contrast-aware deep-blue worklist cards, visible keyboard focus, mobile wrapping, forced-colours support, reduced-motion support and empty-filter recovery.

## Safety and acceptance boundaries

- Queue receipts and handoff previews live in React memory only for the active company; switching businesses or reloading clears them.
- No new API path, provider send, local/session storage, telemetry, cross-brand customer lookup, real staff assignment, task reminder, approval or authorization is introduced.
- Ownership and blocked/due labels are **training examples**, not source-of-truth staff workload, alerting or service level agreements.
- A prepared handoff is not delivered and is not a signed human witness or Proof-B evidence.

## Release evidence checklist

- Focused QL-290–294 regressions: `npm run verify:ql294`.
- Full application suite: `npm --prefix app run test`.
- TypeScript and Vite: `npm --prefix app run check` and `npm --prefix app run build`.
- QL-171 security baseline: `node scripts/__tests__/ql171-operator-baseline.test.mjs`.
- Guarded feature → `dev` → `main` promotion with exact feature tree maintained.
- **Production GREEN only after** all five checks on exact `main` code commit succeed and public Worker JS/CSS SHA-256 match the tested local production bundle.

## Verified release receipt — Production GREEN

- **Exact tested source tree:** `6d9f7e6c6909b43d011c59720163f605f5e8ae8d`, unchanged in feature branch, `dev` merge and `main` merge.
- **Feature → `dev`:** [PR #558](https://github.com/RosevearCreations/rosevear-comms-hub/pull/558), merge commit `bf935437b1c4cd76fd7ef92fd7a7528c44137d79`; Workers and app-build checks successful.
- **`dev` → `main`:** [PR #559](https://github.com/RosevearCreations/rosevear-comms-hub/pull/559), exact production code commit `3fb6f1fedc82fbae7a5d5100f51d4662078857f3`.
- **Production checks on exact `main` SHA:** all five successful — `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`.
- **Live Worker:** `https://rosevear-comms-hub.devilndovelive.workers.dev/` served `assets/index-B8VR50IS.js` (SHA-256 `a760be6673e7bb0d650538eea4baa5bd80ed94390dc307bcbd92c2947ae34bcc`) and `assets/index-G9cvl3rH.css` (SHA-256 `b1da8150bf747177316a45c6dae94d95e68473e904c11839ae74713e48319376`), byte-identical to the tested production bundle.
- **Active batch:** 5/15 Production GREEN, 10 builds remaining. Six app sources remain disconnected/held; ACK evidence remains parked under review.

**Completed local verification:** `verify:ql294` passed 391 focused results (220 QL-289, 16 QL-290, 33 QL-291, 51 QL-292, 38 QL-293 and 33 QL-294/194/197/273); full app passed **1,085 tests in 111 files**; TypeScript check succeeded; QL-171 security passed 10/10 checks; Vite built 490 modules. Tested bundle JS `index-B8VR50IS.js`, SHA-256 `a760be6673e7bb0d650538eea4baa5bd80ed94390dc307bcbd92c2947ae34bcc`, and CSS `index-G9cvl3rH.css`, SHA-256 `b1da8150bf747177316a45c6dae94d95e68473e904c11839ae74713e48319376`.

**Next queued build:** QL-295 — Brand-Safe Contact 360, Consent Context & Duplicate Review.
