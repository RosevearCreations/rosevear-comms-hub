# QL-301 — Management Command Dashboard, Ownership Workload & Incident Status Cards

## Application scope

- Added dense, accessible company-scoped Management and System Status cards for fictional sample workload, blocked handoffs, review checkpoints and fixed incident-age offsets.
- Derived each of the four incident rows per selected company directly from the existing operator dashboard training fixture registry. No invented live incidents, staff assignments, timestamps, SLA clocks or cross-company customer aggregation.
- Explicit preview desk labels, source-channel labels, status filter, screen-reader status count and safe drill-down buttons to inbox, omnichannel event timeline, guided intake and follow-up queue.
- Responsive cards support keyboard focus, forced colors and reduced motion. Company switching mounts the selected company's own four-item fixture set.
- Six supporting integrations remain `DISCONNECTED / HOLD`. ACK delivery stays `UNDER_REVIEW / PARKED_FOR_LATER`; no calls, SMS, dispatch, private source GETs or external writes.

## Validation

- Full application suite: **1,132 tests across 118 files passed**, including QL-301 four-company counts, isolation, empty inputs, category destinations, filters, navigation, status cards and responsive/high-contrast rules.
- TypeScript passed; operator security baseline 1/1 passed; Vite production build compiled 509 modules.
- Feature source tree `c2dfa2b9c65c0ce6e8e9fbb11c14094783812157` advanced through `dev` and [PR #575](https://github.com/RosevearCreations/rosevear-comms-hub/pull/575) to `main` merge `a2b5d64db6abfb51c4a36f430f23f7a1827cf2e8`.

## Production promotion

**Verified Production GREEN:** all five exact-main checks succeeded on code commit `a2b5d64db6abfb51c4a36f430f23f7a1827cf2e8`: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`.

Public Worker `https://rosevear-comms-hub.devilndovelive.workers.dev/` served JS `index-BGUSeEvv.js` SHA-256 `8f71d0aff6f4335fb7b8301880220401b7a2dfdd20c2ecb1a8b8b6c3c4c7c731` and CSS `index-DlcFOHVv.css` SHA-256 `19be6f3cd8a89b1cc31b8ea4802d96d5be870aa2381aef89263835cf5bfa7b01`, both byte-identical to the tested bundle.

**Next after verified GREEN:** QL-302 — Statistics Trend Explorer, Source Provenance & Freshness Explanations.
