# QL-275 — Guided Operator Help Navigation, Accessibility Owner Walkthrough & Signed Proof-B Exception Routing (HELD)

## Objective and scope

Extend the real QL-271–274 Comms Hub command interface with a guided navigation flow, an owner-observable accessibility rehearsal and an actionable six-app original-Proof-B exception checklist. This release is a UI and test release, **not** a source-system, signer, tenant or communications release.

The new **◈ Guided operator walkthrough** disclosure appears beside ⓘ Help, Keyboard shortcuts, Saved view audit and Help & proof review in all four command views. It preserves the dark navy/violet/cyan design and the existing browser-local preference model. The command header and shell identify QL-275.

### Guided navigation

1. **IT Command:** distinguish six GitHub source mappings from a genuinely verified integration.
2. **Management:** interpret four separately scoped fictional business workspaces and simulated tasks.
3. **Analytics:** identify all sixteen events as training fixtures, never live figures.
4. **System Status:** inspect the dated proof observations, release holds and evidence routes.

Each step includes a contextual screen explanation, an explicit route button, and a next-view action. The displayed step follows the actual active command view. Normal keyboard controls, Escape, reduced motion, visible focus and forced colours remain supported.

### Owner accessibility rehearsal

Five concrete, owner-executable checks: keyboard operation, spoken names/announcements, 200% zoom/mobile reflow, forced colours/reduced motion, and local layout preferences/recovery. Each has `Not reviewed`, `Observed locally` and `Issue to retest` choices. These statuses are **in-memory only**, reset when the walkthrough closes and are never interpreted as identity proof, a genuine independent reviewer disposition or authenticated owner acceptance. The display always says **Owner sign-off NOT RECORDED**, even if all checks are selected. On-device assistive technology and human owner/reviewer sign-off remain external prerequisites.

### Signed Proof-B exception routing

For each of the six sources, the operator can select the application and inspect its QL-274 immutable public HTTP 404 snapshot, timestamp, SHA and proof path. The routing queue is `SOURCE_PROOF_MISSING` only when that prior 404 snapshot is under 24 hours old; older/clock-skew snapshots instead show `PUBLIC_RECHECK_DUE`. No claim is made about current GitHub main or authenticated gateway health.

Four separately owned actions are displayed in sequence:

| Stage owner | Required independent action | Current acceptance |
| --- | --- | --- |
| Source maintainer | Audited GREEN A → signed canonical Ed25519 Proof-B at descendant B; immutable raw path and SHA-256 | NOT PROVIDED |
| Independent key custodian | Pinned independent SPKI, signature, ancestry, raw bytes, nonproduction isolation and custody receipt | NOT VERIFIED |
| Independent witness / reviewer | Inspect positive/negative originals, isolation, rollback and own independent disposition | NOT RECORDED |
| Authenticated owner | Separate TEST-only approval for a named isolated nonproduction tenant, ≤30-minute UTC window and GET-only health/capabilities, with witness | NOT GIVEN |

The interface produces a sanitized, read-only draft checklist. **Copy handoff draft** uses the local clipboard when permitted and reports any failure. It sends no message, creates no issue, does not authenticate anyone and never signs or accepts evidence. Buttons route to the existing six-app evidence and connection preflight screens, both HELD.

## Per-application handoff register

The immutable historical source observations are inherited from the genuine public QL-274 recheck on `2026-10-31T00:22:45Z`. No new verification or present-tense statement is implied. Every source has the same four separate disposition owners and its own pinned source SHA.

| Application / role | Public repository | QL-274 immutable SHA | Original Proof-B | QL-275 route |
| --- | --- | --- | --- | --- |
| Rosie Dazzlers · business | `rosiedazzlers` | `565e6142b7a928cf6707b6d227f229ae6ef9c428` | HTTP 404 | Source maintainer → independent custody/witness → owner TEST gate |
| Devil n Dove · business | `devilndove-site` | `3d47209aa9966ec3d7d994190ef6c0939d0ad5b3` | HTTP 404 | Source maintainer → independent custody/witness → owner TEST gate |
| Yard Workers · business | `yw` | `29378a0c9050652f05882a280445750d4a881074` | HTTP 404 | Source maintainer → independent custody/witness → owner TEST gate |
| iCamp · business | `iCamp` | `219251ee433d745a236ac19c682a3a453db72463` | HTTP 404 | Source maintainer → independent custody/witness → owner TEST gate |
| AI Data Platform · supporting | `ai-data-platform` | `79a90aa17c2f04b77b27bd3eca54dbdc50d87fe5` | HTTP 404 | Source maintainer → independent custody/witness → owner TEST gate |
| Rosevear AI Hub · supporting | `rosevear-ai-hub` | `4db6746cbb862b5a4b972c918601ef5c6f3ee927` | HTTP 404 | Source maintainer → independent custody/witness → owner TEST gate |

The exact historical target for each is `docs/integration/ql246-source-proof.json` at the pinned commit. A later public HTTP 200 is **necessary but insufficient**: original signed bytes, SHA-256, the independently trusted Ed25519 SPKI and custodian/witness evidence must all pass separately. All six integrations remain **DISCONNECTED / HOLD**; accepted signatures 0/6, owner TEST grants 0/6, authenticated GETs 0.

## Verification, permissions and production

- `npm run verify:ql275` — targeted component, source-ledger and pre-existing command/help/layout/connection regressions.
- `npm --prefix app run test` — entire application regression suite.
- `npm --prefix app run build` — TypeScript and production bundle.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs` — fail-closed security baseline.
- Production readiness requires merged `dev`, merged `main`, exact-main GitHub build/deploy/preview checks and live inspection of the actual Cloudflare Worker `https://rosevear-comms-hub.devilndovelive.workers.dev/` for the QL-275 markers.

No new localStorage key, source application write, application-gateway request, authenticated GET, phone/SMS transaction, credentials, secret, customer data or private relay is created. No manual screen-reader pass, cryptographic signature or owner permission may be synthesized by automated tests.

## Next candidate

**QL-276 — Owner-Recorded Accessibility Evidence Intake, Proof-B Custodian Routing Receipt & Fresh Public Source Recheck (HELD).** Only actual owner/device evidence and independently authenticated external receipts could change those status fields. Until then the software may be GREEN while connection authorization remains HELD.
