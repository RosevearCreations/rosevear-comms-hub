# QL-315 — Conversation Timeline, Delivery-State Visual Language & Unsent Draft Recovery

## Delivered disabled-preview software

- Added reusable, text-first labels for `RECEIVED_MOCK`, `FAILED_MOCK`, `BLOCKED_MOCK` and `RECOVERED_MOCK`. A locally received source fixture is explicitly **not** customer delivery; a rehearsed recovery is explicitly **not** a provider retry.
- The existing QL-297 event replay timeline now shows chronological numbered steps, attempt, source event identifier, local replay key, mock error code and operator guidance. Colour is supplemental; meaning is always text.
- The existing QL-293 fictional inbox timeline now exposes event IDs, numbered fixture-order steps, source context and explicit non-delivery notes while retaining filters and consent-safe contextual help.
- The QL-196 SMS/MMS composer now reads back `UNSENT` / empty / stale-or-invalid state for the current fictional business/thread. Invalid or cross-company content is hidden rather than recovered; clearing one draft cannot clear another business's state.
- New responsive styling at 320px and 620px, forced-colours and reduced-motion coverage, plus [operator guide](../QL-315_TIMELINE_DELIVERY_DRAFT_GUIDE.md) and [manual capture matrix](../visual/ql315-timeline-capture-matrix.json). Manual screen-reader/owner device acceptance is **PENDING**, not inferred from automated tests.
- No live message, call, SMS/MMS, email, webhook, callback, provider retry, upload, browser persistence, database mutation or external credential use. Six integration gates remain `DISCONNECTED / HOLD`; ACK Delivery Evidence remains `UNDER_REVIEW / PARKED_FOR_LATER`.

## Tested source and release gate

- TypeScript `npm run check`: **PASS**.
- Focused QL-293/297/315 test group: **3/3 files, 21/21 tests PASS**.
- Full `npx vitest run --reporter=dot`: **133/133 test files, 1,202/1,202 tests PASS**. Existing unrelated duplicate React-key warnings remain; no failed test.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**, with `raw-network: 0`, `supabase-mutation: 0`, and real SMS/calls/owner approvals disabled. This static inventory is not a security penetration test.
- `npm run build`: **PASS**, 544 transformed modules, with the existing large-bundle warning.
  - Tested JS `index-aydzSRo_.js` SHA-256 `5ed5984da0296e06858bf11ce1784beb61d90bbd793440c2e3ee0380ef0eadbb`.
  - Tested CSS `index-MtQoxmjr.css` SHA-256 `9cbeed7c68deeba20d60fa713f124504a27b2b3bb98f290f80980ca63d5ae55e`.
- Exact source tree `0360f1de7daaa05a97bee09d75d10a4f2a8f8508` matched local commit `1ac6c66b84071d07c9870f6c2954a188182633e4` and published commit `f96bc728cd261f72d8e587a6a0ec1f34f71d7860`.
- `dev` code SHA `f96bc728cd261f72d8e587a6a0ec1f34f71d7860`; [code PR #604](https://github.com/RosevearCreations/rosevear-comms-hub/pull/604) merged to `main` code SHA `1eeea4b54e1a603a250f2811ac61bd17463b8695`.
- Exact-main GitHub checks: `app-build`, `Build disabled preview`, `Deploy disabled preview`, and `Supabase Preview` all **SUCCESS**.

## Exact-main Cloudflare production verification

**Software Production GREEN at exact code `main` SHA `1eeea4b54e1a603a250f2811ac61bd17463b8695`.** All five applicable checks concluded **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`.

The public Worker at https://rosevear-comms-hub.devilndovelive.workers.dev/ served QL-315 HTML referencing the new asset names. Full downloaded files matched the tested production build:

| Live artifact | HTTP-fetched SHA-256 | Tested bundle comparison |
| --- | --- | --- |
| `index-aydzSRo_.js` | `5ed5984da0296e06858bf11ce1784beb61d90bbd793440c2e3ee0380ef0eadbb` | **Byte-identical** |
| `index-MtQoxmjr.css` | `9cbeed7c68deeba20d60fa713f124504a27b2b3bb98f290f80980ca63d5ae55e` | **Byte-identical** |

This is verified disabled-preview software deployment only; it does not verify physical device acceptance, a real customer delivery or any external integration.

## Queue handoff

QL-315 is the **fifth Production GREEN disabled-preview software build of twenty**, leaving **fifteen**. Next planned build: **QL-316 — Contact 360, Consent Readback & Four-Business Intake Visual Alignment**. After QL-330, future builds require genuine owner acceptance findings, independent evidence and separate owner authorization.
