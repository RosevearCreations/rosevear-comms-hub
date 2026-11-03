# QL-317 — Multi-Line Routing, IVR Scenario Map & Safe Fallback Studio Polish

## Delivered disabled-preview software

- Kept the QL-298 deterministic four-business simulator (`ql298RoutingStudio.ts`) as the only routing decision engine. Added `ql317RouteMap.ts` to project its decisions into a five-step **line → business gate → demo hours/answer → IVR key → terminal safe path** model; unreachable steps explicitly read `NOT REACHED`.
- The operator screen renders the **same five model objects** as a colour-and-text graphic route map and a semantic decision table. `PREVIEW`, `BLOCKED` and `NOT REACHED` never imply actual carrier routing or customer contact. Fallback details explain exactly why a route stops.
- Nine guided A/B comparison cases cover valid new inquiry, wrong business, unidentified shared line, closed hours, missing/unmapped menu option, one-cycle repeat, timeout, mock carrier error and shared-line manual identity claim. Active-company isolation and original QL-298 trace remain available.
- Added independent in-memory edit and **Revert edits to selected example** controls, reset-both action, contextual help, navy/teal/violet/gold graphic cards, responsive layout, 44px controls, labelled fields, focus outlines, reduced-motion and forced-colour support.
- Added [operator guide and nine-case outcome matrix](../QL-317_ROUTING_IVR_MAP_SAFE_FALLBACK_GUIDE.md). Independent physical-device screenshots, screen-reader testing and owner sign-off remain **PENDING**.
- No real number purchase, forwarding, SIP, live DTMF, provider configuration, carrier request, SMS, callback, live call, recording, application integration or external write. Six-app connections remain `DISCONNECTED / HOLD`; ACK Delivery Evidence stays `UNDER_REVIEW / PARKED_FOR_LATER`.

## Tested source and safety

- `npm run check`: **PASS**.
- Complete `npx vitest run --reporter=dot`: **135/135 files; 1,217/1,217 tests PASS**. New QL-317 tests cover all nine cases across each of four businesses, canonical outcome/destination equality, stage identity, state/label/detail parity between graphic map and table, scoped scenario edits, revert, reset and help. Existing QL-298 tests remain passing. Historical unrelated duplicate-key warnings persist without test failures.
- `node scripts/ql171-operator-baseline.mjs`: **PASS**; 363 source files examined, `raw-network: 0`, `supabase-mutation: 0`, live calls/SMS/owner approvals disabled. This is a static drift inventory, not a penetration test.
- `npm run build`: **PASS**, 549 Vite modules transformed; known existing >500kB bundle warning.
- Exact local git source tree `951b198d39451b8fe114a965e092a55b966b7f48` matched GitHub-created tree for the tested six-file commit. Local commit `91bbea0ed9b0cbf8fdb413bc0d62f10d4d8ae600`; remote tested source commit `ec970507a4d7626d3930e395c37da477ff720ba7` on `dev`.
- [Code PR #608](https://github.com/RosevearCreations/rosevear-comms-hub/pull/608) merged to exact code `main` commit `b0ffb16444d18bd5478eec72df27a4b9baf0b529`.

## Exact-main and live Cloudflare Worker verification

**Software Production GREEN** at code `main` SHA `b0ffb16444d18bd5478eec72df27a4b9baf0b529`. Five exact-commit checks completed **SUCCESS**: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, and `Supabase Preview`.

Public Worker: https://rosevear-comms-hub.devilndovelive.workers.dev/ — HTTP 200 served HTML referencing QL-317 build assets. Full HTTP-fetched JS and CSS byte hashes matched the locally built assets:

| Asset | Tested and HTTP-fetched SHA-256 | Outcome |
| --- | --- | --- |
| `index-Dxx2Bgtp.js` | `9cb7e6c85d3c5aeda5228fa0322e444da2c31e22646a02b9e04c502c32884108` | **Byte-identical** |
| `index-DKQugSuM.css` | `0ea42d9989d7d02bc9fca431935542bbde09f899d7fb07e90252464fae8d720b` | **Byte-identical** |

Production GREEN verifies software publication only, **not** authenticated owner-device findings, independent screen-reader acceptance, genuine phone/carrier authorization, source identity attestation, or six-app integration readiness.

## Queue handoff

QL-317 is the **seventh of twenty Production GREEN disabled-preview builds**; **thirteen** remain. **Next planned: QL-318 — Assignment Workboard, Follow-Up Cards & Safe Handoff Review.** This next item is not automatically authorized or started. QL-330 ends this batch; any later roadmap requires separate owner authorization based on real acceptance evidence.
