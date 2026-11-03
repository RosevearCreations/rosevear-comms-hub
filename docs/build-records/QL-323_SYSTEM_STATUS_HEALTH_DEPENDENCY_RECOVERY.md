# QL-323 — System Status Health, Dependency Map & Guided Failure Recovery

## Disabled-preview software delivered

- The System Status command now leads with separate cards for the prior documented application release, browser-rendered preview, historical build checks, unknown external live health, six held connectors and public-proof freshness. None is treated as continuously verified system health.
- A visible proposed six-source dependency map and equivalent accessible table distinguish the four independent business workspaces from the AI Data Platform shared reporting layer and the Rosevear AI Hub private Windows edge service. Every relationship is **PLANNED ONLY / DISCONNECTED / HOLD**; the private relay remains OFF.
- The existing QL-303 pinned public-proof results are displayed with exact historical UTC times, stale/unknown-clock warnings and truthful HTTP 404 meaning. A missing proof file cannot be mistaken for a real application outage.
- A source-selectable, in-tab recovery studio explains **unobserved, offline, timeout, invalid response, stale snapshot and simulated fixture recovery**, with ordered non-destructive guidance and visible zero provider requests/restarts. Even cleared fictional errors do not yield real source GREEN. I.T., six-app evidence and connection-plan navigation remains accessible.
- [Owner walkthrough, exact source matrix, and remaining acceptance boundaries](../QL-323_SYSTEM_STATUS_DEPENDENCY_RECOVERY.md).

## Verification and exact source

- Focused QL-271/QL-303/QL-323 tests: **15 / 15 PASS**.
- Final sequential bounded full regression: **141 / 141 files, 1,280 / 1,280 tests PASS** (`npm run test -- --maxWorkers=2`). An earlier concurrent full run suffered older QL-222/QL-286 test timeouts under CPU contention and was stopped; the final isolated full rerun cleared those failures.
- `npm run build` **PASS** (includes TypeScript `tsc --noEmit`), 563 Vite modules. Existing oversized-bundle warning remains an optimization follow-up.
- `node scripts/ql171-operator-baseline.mjs` **PASS**: 372 source files, 0 raw network sinks, 0 Supabase mutations; live calls/SMS and real approvals disabled. Static inventory is not a penetration test or operational authorization.
- Local tested source commit `762737603857a5d2ad4c334604b8876c605791e0`, tree `33d9803aaf69db7d389c7df5213a9b0f412f12a7`. The GitHub connector created an **identical tree** on `dev` at `92bec3bec103ae93c9f2828c5a9a8924e26722ef`.
- [Code PR #619](https://github.com/RosevearCreations/rosevear-comms-hub/pull/619): exact-head `app-build` and `Workers Builds: rosevear-comms-hub` **SUCCESS** prior to merge; Supabase Preview **SKIPPED** because branch previews are disabled.
- Exact code merge on `main`: **`4a021aa916d157dca95903a0bc4d37b18b029636`**; `dev` fast-forwarded to the same commit. All five exact-main checks **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, and `Supabase Preview`.

## Public Worker publication evidence

Public **disabled** preview: https://rosevear-comms-hub.devilndovelive.workers.dev/. The HTTP-fetched live HTML listed the QL-323 content-hashed assets. Their downloaded bytes matched the tested local production bundle:

| Asset | Local and live SHA-256 | Status |
| --- | --- | --- |
| `index-Pu5eq3xG.js` | `4f9fba7ab6fc7c0bbff1353481df771895a688937062a1c46aea049b6413c41a` | **Byte-identical** |
| `index-qlrercE8.css` | `8ba0a2a1de9173cc221dfce093a8c4fea7fac42fcef9e393df2fab54e1e8329e` | **Byte-identical** |

These checks verify **published preview software only**. They do **not** certify real provider uptime, authenticated monitoring, actual incidents, owner physical-device/screen-reader acceptance, external proof custody, TEST authority or Windows relay deployment. Six integrations remain **DISCONNECTED / HOLD**; ACK Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**. Live communications, private gateway requests, credential entry, customer-data reads, remote restart and account grants remain **OFF**.

## Queue handoff

QL-323 is the **thirteenth of twenty Production GREEN software-only builds**. **Seven remain.** Next proposed: **QL-324 — Six-App Connection Catalogue, Topology & Tenant-Scope Blueprint**, requiring separate source work, validation and production receipt.
