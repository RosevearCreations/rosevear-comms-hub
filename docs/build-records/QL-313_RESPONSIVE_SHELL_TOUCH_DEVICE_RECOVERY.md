# QL-313 — Responsive Operator Shell, Touch Targets & Device Layout Recovery

## Delivered preview software

- Added a collapsible tablet/phone workspace menu at 850 CSS pixels and below, with explicitly announced expanded state, **Done browsing**, Escape return-focus behavior and desktop/orientation recovery. Navigating to a workspace closes the temporary menu and focuses the destination heading.
- Preserved current business, navigation search, workspace and QL-312 comfortable/compact and standard/high-contrast controls in React state across navigation-menu reflow; no new persistence or private data writes.
- Added responsive status and content wrapping; 44-pixel minimum touch height for applicable buttons, inputs, selects and summary controls; horizontally scrolling evidence-table containers so actions and columns are not truncated by the page edge.
- Added inline phone/tablet/zoom help, [device recovery instructions](../QL-313_RESPONSIVE_SHELL_DEVICE_RECOVERY.md), and a [five-width/six-category capture matrix](../visual/ql313-responsive-viewports.json). The matrix is deliberately `PENDING_BROWSER_CAPTURE / NOT_PERFORMED` for real owner-device observations.
- All six connections remain **`DISCONNECTED / HOLD`**, ACK delivery evidence **`UNDER_REVIEW / PARKED_FOR_LATER`**, and real communications, owner sign-off, hosted database and relay remain disabled.

## Source and test evidence

- `npm run check`: **PASS**.
- Focused QL-311/312/313 regression: **3 files, 18 tests PASS**.
- Full `npx vitest run --reporter=dot`: **131/131 files and 1,186/1,186 tests PASS**. Existing duplicate-key React warnings originate from an earlier review fixture; no failure arose from this build.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**; zero raw-network sinks or Supabase mutation sinks, real calls/SMS and approvals disabled. This is a source inventory, not an independent security test.
- `npm run build`: **PASS**, 540 transformed modules; the existing large-JS-bundle warning persists.
  - Tested JS `index-BUOcWqmA.js`: SHA-256 `4a1501bf2fe00d2df6af24d332c8900f77ada8c5b8ae5bf80b30a5891a73c9a6`.
  - Tested CSS `index-C2Ecr7c5.css`: SHA-256 `589186a37b67cfdd8a52cfefbe68385c34051459d871c26a951e2a2faa96d037`.
- Source `dev` commit: `85c3d46d2dddbf8ac6ceadff1922f265a16ea55f`; [code PR #600](https://github.com/RosevearCreations/rosevear-comms-hub/pull/600) merged into code `main` commit `a034681ea268ee446313da2bfffe3c3ecef05230`.

## Exact-main production verification

**Software Production GREEN at exact code `main` SHA `a034681ea268ee446313da2bfffe3c3ecef05230`.** The five applicable checks finished successfully: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`. The `dev` source commit also passed `app-build` and Cloudflare Workers (the optional Supabase Preview was skipped on `dev`).

Live Cloudflare Worker: https://rosevear-comms-hub.devilndovelive.workers.dev/ . Its published HTML referenced the QL-313 bundles, and their full fetched bytes matched the locally tested build:

| Public asset | Production SHA-256 | Tested build comparison |
| --- | --- | --- |
| `index-BUOcWqmA.js` | `4a1501bf2fe00d2df6af24d332c8900f77ada8c5b8ae5bf80b30a5891a73c9a6` | **Byte-identical** |
| `index-C2Ecr7c5.css` | `589186a37b67cfdd8a52cfefbe68385c34051459d871c26a951e2a2faa96d037` | **Byte-identical** |

This is a source/build/runtime-asset verification of a disabled-preview release, **not** a physical-device observation or external connection test.

This preview release does not imply owner physical-device acceptance, account/capability authorization, independent immutable six-app proof, live tenant integration, or a management sign-off.

## Queue

QL-313 is the **third software Production GREEN build of twenty**, leaving **17**. Next queued: **QL-314 — Unified Inbox Visual Triage, Clear Empty States & Saved Filters**. After QL-330, do not automatically queue QL-331; new builds must be supported by genuine owner findings and independently verified evidence and separately authorized by the owner.
