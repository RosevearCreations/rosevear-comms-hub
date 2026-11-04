# QL-329 — Master/Shell Source of Truth, Cross-Device Security and Performance Regression

## Scope delivered

- I.T. Command now includes master → four application shells → child-business architecture, a six-source table, local denial outcomes, accessible responsive controls and a [new seven-repository Source of Truth v2](../ROSEVEAR_SOURCE_OF_TRUTH_V2_2026-11-03.md).
- YW and iCamp connect **at the application shell**, not directly to Rosevear Landscaping or Camp Rosevear. Rosie Dazzlers and Devil n Dove are existing owned-business examples inside future multi-child shell designs, not provisioned additional tenants.
- The canonical mapping denies a child as the connector, wrong shell/child matches, supporting systems as customer tenants, and unverified master authority. This is a pure preview, NOT master SSO or actual server-side tenant authorization.
- Five emulated widths (320, 375, 768, 1024, 1440 px), keyboard focus, labelled controls, forced colours, reduced motion, tenant separation and no-network UI tests passed. **No physical-device or real screen-reader acceptance was performed.**

## CI and code promotion

- [Code PR #632](https://github.com/RosevearCreations/rosevear-comms-hub/pull/632) merged as exact code main commit **0eb048661cb686c81cf20f0c98d4f1e8d98f2d24**, source head **ddce51e6dbfdc2407b67231b636cfa4bd0bb1367**.
- GitHub exact-main full Vitest **147/147 files, 1,371/1,371 tests PASS**; 20 new QL-329 tests. TypeScript and Vite production build PASS, 581 modules transformed.
- QL-171 static safety PASS, 384 source files scanned, raw-network **0**, Supabase mutations **0**; static analysis is not proof of operational access control.
- Exact code main production checks all SUCCESS: GitHub app-build, Build disabled preview, Deploy disabled preview, Supabase Preview, and Cloudflare Workers Builds.

## Measured bundle gate (not a speed-improvement claim)

| Output | QL-328 baseline (rounded) | QL-329 actual bytes | CI upper limit | Outcome |
| --- | ---: | ---: | ---: | --- |
| JS raw | 3,084,840 | **3,099,167** | 3,500,000 | PASS |
| CSS raw | 435,250 | **439,659** | 550,000 | PASS |
| JS gzip | 665,460 | **669,285** | 780,000 | PASS |
| CSS gzip | 78,330 | **79,022** | 115,000 | PASS |

The extra architecture interface slightly increases code size; **no performance improvement is claimed**. Existing large-bundle warnings still deserve separate optimization with real browser measurements. The [QL-329 CI budget verifier](../../scripts/ql329-asset-budget.mjs) fails over-budget outputs and has negative regression tests.

## Independent public Worker proof

The separate public-only [verification run #41751514604](https://github.com/RosevearCreations/rosevear-comms-hub/actions/runs/41751514604) for exact source main commit 0eb048661cb686c81cf20f0c98d4f1e8d98f2d24 returned **SUCCESS** on November 4, 2026 at 01:06:32 UTC. It rebuilt the disabled-preview bundle, fetched the public Comms Hub Worker HTML and its JS/CSS, and verified byte-identical SHA-256:

| Public asset | SHA-256 (both locally tested and publicly served) | Outcome |
| --- | --- | --- |
| index-DvotBUS6.js | a3513cc45c0a376a9ead04b4c8f511da05ffc0f3622d8a54901a267ce8e45ca9 | **Exact match** |
| index-D5MqGv6Q.css | 73b0cf4f17e6319ba265df7f58aae6b35ad05e610a402a98b2a2927c4ee3e1d8 | **Exact match** |

This was **public static-asset evidence only**, with zero calls to the six application source APIs. Comms preview Production GREEN is not application integration GREEN.

## Unmet external gates and next build

- Rosevear Master identity provider **NOT DEPLOYED**. The source-side signed original Proof-B, independent custody, authenticated broker, owner TEST approval, scoped child tenant grants and real cross-app production authorization are not fulfilled by QL-329.
- All six source connections stay **DISCONNECTED / HOLD**, the AI Hub Windows relay stays **OFF**, and ACK remains **UNDER_REVIEW / PARKED_FOR_LATER**. No new credentials, database or provider records, messaging or customer information were accessed.
- Final documentation receipt must pass applicable main CI and repeat public parity. Manual physical-device acceptance remains pending.

**Next in the approved software batch: QL-330 — Final Setup Reconciliation, Owner Walkthrough Packet & Evidence-Led Next-Batch Handoff.** No additional automatic batch; authenticated inter-app activation requires separately verified source-side scopes and owner authorization.
