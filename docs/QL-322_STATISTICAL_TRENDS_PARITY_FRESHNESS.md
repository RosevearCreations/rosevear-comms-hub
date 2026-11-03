# QL-322 — Statistical Trend Explorer, chart/table parity and freshness

## Owner walkthrough

1. Open **Analytics** and select a business. Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers have separate QL-191 sample queues; AI Data Platform and Rosevear AI Hub are supporting services, not extra company datasets.
2. Select **7, 14 or 28 fictional days**, then one category (or all). All rows, four-colour stacks, totals and the source record table are derived from the same QL-302 synthetic event offsets.
3. Choose a chart bar or its matching period in the accessible table. The source explorer narrows to exact QL-191 fixture IDs. Clear the period selection to restore all matching records. Changing a time window, category or business safely resets the period selection.
4. Inspect the **previous equal-length demo window** metric: for 7- or 14-day selections, the earlier comparable interval is inside the 28-day example coverage. A true zero is shown as **0**; the 28-day previous interval has no sample coverage and is shown as **Unknown**, never as zero.
5. Inspect freshness: the bundled demo fixtures have **no real observed-at or refreshed-at timestamp**. The last real event, actual snapshot age and live event volume are **Unknown**, and a real refresh has **Never connected**. No current date is invented for the offsets.

## Exact source and evidence rules

| Surface | Source | Reconciliation |
| --- | --- | --- |
| Category legend | `QL322_CATEGORIES` in `ql302StatisticsTrend.ts` | Same four categories as table columns and chart stacks; labels and numbers convey meaning without colour |
| Chart and aggregate table | `ql322TrendModel` over `ql302FixtureEvents` | Each period count equals the sum of its four category cells; period counts sum to filtered total |
| Source drill-through | `ql322BandSources` / `dashboardQueues[organization]` | Fixture IDs filtered by same category, window and selected period; no cross-company records |
| Comparison | 28 fictional-day covered offsets | Prior period beyond source coverage returns `null` (Unknown), not `0` |
| Live-feed status | No telemetry integration | Live data is unknown, even though provider requests remain disabled |

## Safety and acceptance boundaries

- This is **software-only**, a disabled preview with fictional records and invented day offsets, not operational analytics, a refreshed dataset, a data export or any customer financial/performance statistic.
- No connection to providers, external accounts, authenticated source data, live communication or six-app telemetry. All six integration gates remain **DISCONNECTED / HOLD**; ACK delivery evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**.
- Automated acceptance must cover every company × time window × category, bar/table/source parity, zero vs unknown, selected-period navigation and scope changes. A physical owner-device, screen-reader and high-zoom visual acceptance still requires separate evidence and authorization.
