# QL-321 — Management Command KPIs, Workload & Incident Drill-Through

## Delivered disabled-preview software

- The Management Command now opens a four-business, source-reconciled cockpit. Its six clickable KPI tiles, high-attention cards and filtered source table derive from **two distinctly labelled fictitious datasets**: four QL-301 incident scenarios and the QL-194 company queue (four sample tasks initially per brand). These are not merged into an invented operational incident or workforce total.
- KPI-to-row drill-through works for incident status, overdue and unassigned tasks, and all attention records. The source table includes text severity, sample due-time and responsibility labels, exact fixture filenames/IDs, searching, empty recovery, a table caption, semantic headings and a keyboard-scrollable table on narrow viewports.
- Queue drill-through uses the existing `OperatorShell` queue-open handler and the source thread ID; incident scenarios navigate to their original preview destinations. The QL-301 historical explorer remains accessible in the Management view, and System Status retains its original fixture cards.
- Role-specific shortcut visibility is explicitly a **display preference**, not an authenticated permission. Company/queue and sample owner/thread mismatches fail closed. In-memory queue edits recalculate KPIs and do not communicate with a provider.
- [Guide, source matrix and remaining manual gaps](../QL-321_MANAGEMENT_KPI_WORKLOAD_INCIDENT_GUIDE.md).

## Verification and exact code source

- Focused QL-301/QL-321 tests: **20/20 PASS**. Full Vitest regression with bounded workers: **139/139 files, 1,259/1,259 tests PASS**; an earlier unbounded run had two resource-related timeouts, both cleared in the bounded full rerun.
- TypeScript `npm run check` **PASS**; Vite `npm run build` **PASS** with 560 transformed modules. Existing large-bundle warning remains an optimization issue.
- `node scripts/ql171-operator-baseline.mjs` **PASS**: 370 source files; raw network sinks **0**, Supabase mutations **0**, live call/SMS dispatch and genuine approvals disabled. Static scan is not a security penetration test.
- Local tested source commit `7c006a675626ec760fb2ec55e67ed99c4238045a`; GitHub connector tree `d0ef68273976eb02df01c9dce713505b48a46ea2` **exactly matched** the local committed tree. `dev` source commit `d9e1871db57839847217c53338f00aaa3bc42235`.
- [Code PR #616](https://github.com/RosevearCreations/rosevear-comms-hub/pull/616) had exact-head `app-build` and `Workers Builds: rosevear-comms-hub` **SUCCESS** before merging. Supabase Preview PR was **SKIPPED** because branch previews are disabled.
- Exact code merge to `main`: **`dc91df6867de21c6a76933bebf93a1957ecda94c`**. Main-triggered checks **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`. Moving `dev` forward to the same commit triggered a separate Worker check; it was also required to pass before receipt publication.

## Exact live Worker publication

Public **disabled** preview: https://rosevear-comms-hub.devilndovelive.workers.dev/. The HTTP-fetched live HTML identified the exact QL-321 content-hashed JS/CSS filenames, and downloaded asset SHA-256 hashes agreed byte-for-byte with the tested local production bundle:

| Asset | Local and live SHA-256 | Result |
| --- | --- | --- |
| `index-BDu1uuCp.js` | `5e850d76d0c3c8ba2502171fc165c9aee796f6dcb0bb552c3016cea7d4fa30ae` | **Byte-identical** |
| `index-Cj4_UHJu.css` | `f2ef7cf7c86e8493a45345c902d2a025a80c3f209fbb721ff7ba0e79cef54456` | **Byte-identical** |

These checks verify **published preview software**. They do **not** verify actual staff access control, physical-device/screen-reader owner acceptance, real incident closure, authentic independent source Proof-B, provider receipts or six-app connections. Live calls, SMS, email, ACK, dispatch, account grants and real customer actions remain **OFF**; six-app gate **`DISCONNECTED / HOLD`** and ACK delivery evidence **`UNDER_REVIEW / PARKED_FOR_LATER`**.

## Queue handoff

QL-321 is the **eleventh of twenty Production GREEN software-only builds**, with **nine remaining**. **Next proposed: QL-322 — Statistical Trend Explorer, Chart/Table Parity & Freshness Labelling.** It requires its own authorization and independently verified production receipt.
