# QL-323 — System Status Health, Dependency Map & Guided Failure Recovery

## What the owner can review

1. Open **System Status**. The new QL-323 command panel is above the existing QL-301 incident explorer, QL-303 capability evidence and QL-307–310 release controls. No historical source-review path is removed.
2. Read the four status cards. **Documented software release** means a prior release receipt exists, **not** that a live Worker or external provider was polled. External health is explicitly **UNKNOWN**; all six integration connections are **HOLD**.
3. Review the proposed dependency map and matching table. The four independent business sources are Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers; the two supporting services are AI Data Platform and Rosevear AI Hub. Every depicted connection is a **plan**, not a live topology. The Windows relay remains **OFF / not installed** for integration.
4. Inspect six immutable public-proof observations from QL-303. Their HTTP 404 status applies to one pinned proof-file path at a recorded UTC time, not to the application's present health. Snapshots one full day or older are labelled **STALE**; impossible clock ordering is **UNKNOWN / CLOCK REVIEW**. Links lead to the pinned public proof, and in-app buttons open existing I.T. diagnostics and six-app evidence.
5. Under **Guided failure recovery**, pick an example source and one of **Unobserved, Offline, Timeout, Invalid response, Stale snapshot, or Fixture recovery**. The explanation and ordered non-destructive steps update in this tab. They cannot run a request, retry, restart, change a connection state, sign a release, or send a notification. **Fixture recovery** never becomes external health GREEN.

## Source, parity and acceptance

| Review surface | Source | Required distinction |
| --- | --- | --- |
| Release summary | Verified [QL-322 release receipt](build-records/QL-322_STATISTICAL_TRENDS_PARITY_FRESHNESS.md) at merge `15651e437bd54528aa87ffa06c7b1250e1012ba0` | Exact historical software documentation, not a continuous health monitor |
| Dependency map and table | `QL270_SOURCES` → `QL323_DEPENDENCIES` | Six matching roles; four businesses and two supporting services; all planned/held |
| Evidence age | `QL303_ROWS` and `ql303AgeDays` | Dated public pinned proof 404, not today's outage or live source health |
| Failure scenarios | `QL323_SCENARIOS` / `ql323Assess` | Unknown/offline/timeout/invalid/stale/rehearsal recovery produce no claimed real GREEN |
| Recovery navigation | Existing `it_command`, `connections`, `six_app_evidence` routes | User-initiated, local-only navigation; no hidden requests or side effects |

Automated checks must exercise the full scenario matrix, invalid inputs, old and future-clock observations, all six dependency links, accessible tables/labels, focus-visible and mobile layouts, and navigation to existing evidence. Owner physical-device and screen-reader walkthrough, genuine system health monitoring and independent provider/tenant acceptance require separate evidence.

## Hard safety boundary

No secrets, live health endpoint, private source GET, real customer data, provider callback, automatic restart, Windows relay installation, Slack/email/SMS/call/ACK, tenant grant, actual incident resolution, or independent sign-off. Six integrations remain **DISCONNECTED / HOLD** and ACK Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**.
