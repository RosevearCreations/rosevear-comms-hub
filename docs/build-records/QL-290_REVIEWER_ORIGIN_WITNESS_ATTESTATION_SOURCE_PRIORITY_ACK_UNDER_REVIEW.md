# QL-290 — Independent reviewer challenge origin reconciliation, original Proof-B witness attestation preconditions & six-app source recheck exception priority queue

**Scope:** a disabled-preview review tool. No independent reviewer has been authenticated, no challenge has been issued, no original Proof-B or attestation has arrived, and no owner TEST authorization is granted. The separate Six-App Acknowledgement Delivery Evidence workstream remains **UNDER_REVIEW / PARKED_FOR_LATER**. All six integrations stay **DISCONNECTED / HOLD**.

## Actual immutable public source recheck — 31 October 2026

At **2026-10-31T17:40:31Z (13:40 Eastern)** the six GitHub source repositories' public `main` SHAs were resolved. Each `docs/integration/ql246-source-proof.json` path was then checked using the public GitHub contents API pinned to that **exact** SHA. Every request returned **HTTP 404 Not Found**. These are public file observations, not authenticated application gateway GETs.

| Source repository | QL-289 immutable `main` SHA | QL-290 immutable `main` SHA | Priority | Original Proof-B |
| --- | --- | --- | --- | --- |
| `ai-data-platform` | `8c475583f5d84f8dbb47aa295b0f034e4b7b41c1` | `a7a65c16483ac42ed8f07b9aa95687a640f73874` | P0 · moved | HTTP 404 |
| `devilndove-site` | `bf98beea75f0caa8aeb872c2646dcaa6661d7a23` | `3819fa1ffaa474722b9666d8a96479980d752fac` | P0 · moved | HTTP 404 |
| `rosiedazzlers` | `e015a719e0ef37d9ecb448a2a70145a7baf0f4d8` | `9c6788da1db873d980af6ffdc36ff55a1ffbb9e7` | P0 · moved | HTTP 404 |
| `yw` | `7c00eb311b6f9f825dde5c0171aeed932079b086` | `7c00eb311b6f9f825dde5c0171aeed932079b086` | P1 · stable | HTTP 404 |
| `iCamp` | `f28c89dbb0265cb222b8a853ae624bdb9858ca67` | `202c53627a789841ec1b9b3dd58381e956c33196` | P0 · moved | HTTP 404 |
| `rosevear-ai-hub` | `f2f22f929ed099afbf4d9e56a7e3145c011ab9fc` | `d37279724b948fdee324e157853d3c32563e82e0` | P0 · moved | HTTP 404 |

The five P0 cases combine SHA drift and missing original; the stable Yard Workers P1 still lacks its original. The next independent public check is due by **2026-11-01T17:40:31Z** or sooner upon relevant new claim or drift. An unchanged SHA is not a verified receipt and a later HTTP 200 would not validate signing authority.

## Implementation

1. **Reviewer challenge origin reconciliation:** seven explicit unsatisfied identity/origin/signature/challenge/issuer/witness/owner gates. Only an intact QL-289 unissued challenge matrix can be referenced. Duplicate local case references, forged prior approvals, fake issuer authority, alleged receipt acceptance and invalid chronology fail closed. A draft is `LOCAL_UNVERIFIED_ORIGIN_RECONCILIATION`, not an external review or approved decision.
2. **Original witness attestation prerequisites:** six absent original/custodian/witness/source-pin/chain/owner gates. Accept only an intact QL-289 open witness case tied to its actual QL-289 immutable SHA. A local preflight records the new QL-290 SHA and missing attestation, never a signer verification, original acceptance or closure receipt.
3. **Six-app exception priority:** a responsive, filterable, ranked public source ledger (`P0` drift+404; `P1` stable+404), timestamp and 24-hour age readback, pinned source URLs, and unsent local priority item drafts gated on QL-289 unexecuted predecessors. Age recalculation does not issue GETs. No automatic polling or external notifications.
4. **Usable owner surface:** accessible tabs, keyboard/focus states, explicit incomplete badges, responsive source cards, forced-colors/reduced-motion support, read-only JSON case packet, separate local clearing and session-only continuity with QL-289. No localStorage/database secrets or persistent owner decisions.
5. **ACK security boundary:** ACK delivery remains **UNDER_REVIEW / PARKED_FOR_LATER**, outside this batch; no real SMS/calls, notification routes, source gateway GETs or provider configuration. Six systems remain **DISCONNECTED / HOLD**.

## Release gates

- `npm run verify:ql290`: QL-289 regression suite plus QL-290/connection tests.
- `npm --prefix app run check`, `npm --prefix app run test`, `node scripts/__tests__/ql171-operator-baseline.test.mjs`, `npm --prefix app run build`.
- Exact tested Git tree through feature → `dev` → `main`, green final-main checks, live Cloudflare Worker asset SHA-256 comparison with locally built JS and CSS.
- A PR, queued check or public snapshot alone does not justify claiming production GREEN.

## Next planned build

**QL-291 — Operator Command Centre Density, Guided Card Navigation & Role-Safe Layout Recovery.** Build compact, information-rich IT/Command cards, clear guided navigation, contextual ⓘ help and safe reuse of QL-272 local layout preferences, with keyboard/mobile/text-zoom validation and no permission escalation.

See the [active QL-290–304 build queue](../QL-290-304-REQUIRED_BUILD_QUEUE.md). The next release consumes that queue only after verified production checks.
