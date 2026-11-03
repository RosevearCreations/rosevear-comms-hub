# QL-318 — Assignment Workboard, Follow-Up Cards & Safe Handoff Review

## Delivered disabled-preview software

- Enhanced the real QL-194/294 **Assignments & follow-ups** workspace, retaining the original four-company synthetic tasks, deterministic worklist sorting, six lanes, owner filtering, source-linked inbox/Customer 360 navigation and Alt + Shift keyboard shortcuts.
- Added graphic workboard cards and a selected-task snapshot with readable **fictional owner, illustrative due window, severity, attention state and session receipt history**. Distinct colours are accompanied by explicit text; layout adapts to narrow devices and honours reduced-motion/forced-colour settings.
- `ql318Workboard.ts` derives cards, per-company sequence-sorted history and handoff freshness from the existing reducer. `ql194WorkQueue.ts` now records the session-only receipt sequence when preparing an UNSENT summary; an assignment edit **cannot revive the old handoff even if that field is changed back**.
- The stale handoff's old text is hidden and **Review current UNSENT summary in this tab** is disabled until a new summary is prepared. A valid readback says **READ LOCALLY · UNSENT · NOT AN APPROVAL** and performs no external action or ownership change. Done tasks cannot prepare new handoffs.
- Help text explains keyboard shortcuts, fictional worklist states, revision-aware stale handling and local-only review. The [operator walkthrough](../QL-318_ASSIGNMENT_WORKBOARD_SAFE_HANDOFF_GUIDE.md) has the explicit fresh/stale/foreign-case matrix.
- **Not enabled:** real staff assignment, notification, call/SMS, dispatch, owner approval, external handoff, customer contact, CRM or database mutation, browser persistence or API request. Six-app integrations remain `DISCONNECTED / HOLD`; ACK Delivery Evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## Tested source and safety

- `npm run check`: **PASS**.
- Focused QL-194/294/318 regression: **3/3 files, 34/34 tests PASS**.
- Full `npx vitest run --reporter=dot`: **136/136 files, 1,229/1,229 tests PASS**. New QL-318 tests cover all four company rosters, sorted severity/attention cards, company/recipient isolation, ordered action history, stale-after-edit-and-reversal, no stale-content readback, refresh, keyboard controls and zero external/storage calls. Historical unrelated duplicate React-key warnings persist without failures.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**, 364 source files checked, `raw-network: 0`, `supabase-mutation: 0`, live calls/SMS/real owner approvals disabled. This is a static sink inventory, not a penetration test.
- `npm run build`: **PASS**, 551 modules transformed, known large-bundle warning.
- Tested local source commit `0685a5391bcb84a856a04efce4d0174e5b212d9c` and GitHub-created source tree both produced `23998394348bd1649f8a12d1bf7cfe1c5b9bea97`. Published source commit on `dev`: `da5ef3d06d1b3af4b6d8d85abaecded55fc2e663`.
- [Code PR #610](https://github.com/RosevearCreations/rosevear-comms-hub/pull/610) merged to exact software `main` commit `b21d794d83d5ae2604d1c2b910386357ed456884`.

## Exact-main and live Worker verification

**Software Production GREEN** at exact code `main` SHA `b21d794d83d5ae2604d1c2b910386357ed456884`. All five applicable checks completed **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`.

Public Worker: https://rosevear-comms-hub.devilndovelive.workers.dev/ — HTTP 200 served the QL-318 HTML pointing to these full HTTP-fetched files, byte-identical to the tested build:

| Asset | Local and live SHA-256 | Result |
| --- | --- | --- |
| `index-B5hlkHZG.js` | `ca6b963a6ece5167785791a6529cf2a6dee2199132247e618d747b73d4abfaba` | **Byte-identical** |
| `index-BWKnbA9y.css` | `b96472a68aae5ad0b2c1d891a838f7ae4751468394f6ab00dd2a1eaf00bae689` | **Byte-identical** |

This verifies disabled-preview software publication, **not** real staff credentials, any live notification, external delivery, real owner approval or physical-device accessibility acceptance. Independent owner screen captures and screen-reader review remain **PENDING**.

## Queue handoff

QL-318 is the **eighth of twenty Production GREEN disabled-preview builds**, leaving **twelve**. **Next planned: QL-319 — Admin Preferences, Saved-View Recovery, Shortcuts & Contextual Help Finish.** QL-319 is not automatically started. Builds after QL-330 require a separately authorized roadmap informed by real owner acceptance and independently verified evidence.
