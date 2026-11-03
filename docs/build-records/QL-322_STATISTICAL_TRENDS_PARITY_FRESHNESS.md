# QL-322 — Statistical Trend Explorer, Chart/Table Parity & Freshness Labelling

## Software delivered

- The existing QL-302 Statistics panel now gives four isolated fictional businesses a category-coloured stacked trend chart, a numerically identical accessible source table and a selectable period drill-through to precise QL-191 fixture IDs.
- Seven-, fourteen- and twenty-eight-**fictional**-day selections and category filters use the same aggregation. Source rows follow the same company, window, category and period selection. Empty data is a **known sample zero**, never a claim about real-world events.
- Previous equal-length comparison is shown only where the earlier period lies inside the 28-day fictional sample coverage. Out-of-coverage comparisons are **Unknown**, not zero; real live event volume, last observed timestamp and source snapshot age are all **Unknown**, with no fabricated refresh date.
- [Owner walkthrough, matrix, provenance and remaining acceptance gaps](../QL-322_STATISTICAL_TRENDS_PARITY_FRESHNESS.md).

## Exact local source and verification

- Focused QL-302/QL-322 checks: **23 / 23 PASS**.
- Bounded full Vitest regression: **140 / 140 test files; 1,274 / 1,274 tests PASS** (`npm run test -- --maxWorkers=2`).
- `npm run check` **PASS**; `npm run build` **PASS**, 560 Vite modules transformed. The pre-existing oversized-bundle warning remains nonblocking.
- `node scripts/ql171-operator-baseline.mjs` **PASS**: 370 scanned sources, 0 raw network sinks, 0 Supabase mutations; live calls, SMS and real approvals remain disabled. Static inventory is not a security penetration test.
- Local source commit `8650d89` produced tree `ddb6b89d4edf90fa61ca23b52b18b6a66201810f`. The GitHub connector created the **identical Git tree** and committed QL-322 on `dev` at `a2ba106da74477434112506639a0b7d8660cc9a4`.
- [PR #617](https://github.com/RosevearCreations/rosevear-comms-hub/pull/617) contained the previously queued QL-321 receipt and QL-322 implementation. Its exact-head `app-build` and `Workers Builds: rosevear-comms-hub` **SUCCESS** before merge; branch Supabase Preview **SKIPPED** (branch preview disabled).
- Exact `main` merge: **`ed2f5b40d06cd467731bee94ee3f13ac4895fc9d`**. `dev` was fast-forwarded to that same commit. All five exact-main checks **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`.

## Published Worker proof

Public **disabled** preview: https://rosevear-comms-hub.devilndovelive.workers.dev/. HTTP-fetched live HTML listed the QL-322 content-hashed JS/CSS. Their HTTP-fetched bytes matched the tested local Vite bundle SHA-256 hashes:

| Asset | Local and HTTP-fetched live SHA-256 | Status |
| --- | --- | --- |
| `index-dWdZBzZ8.js` | `e2ade1094e716e62e500ae84019a280ff1bcde5e1c36848d129eae742859b089` | **Byte-identical** |
| `index-ClIN7B9s.css` | `bfdaca4bc3c647ddb4967de52aa472a5e9e7b46a4da0d9106808baff44e07c22` | **Byte-identical** |

**Boundary:** This is a verified software-only release, not verified real staff/company performance, independent owner-device or screen-reader acceptance, genuine provider evidence, live telemetry, or signed connection authorization. Four company fixtures remain distinct; AI Data Platform and Rosevear AI Hub are supporting services, not fifth or sixth customer tenants. All six integrations remain **DISCONNECTED / HOLD**, ACK Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**, and real calls, SMS, email, dispatch, data export, account grants and customer actions are **OFF**.

## Queue handoff

QL-322 is the **twelfth of twenty Production GREEN software-only releases** in the batch; **eight remain**. **Next proposed: QL-323 — System Status Health, Dependency Map & Guided Failure Recovery**, subject to its own verified production receipt and any separately required owner authorization.
