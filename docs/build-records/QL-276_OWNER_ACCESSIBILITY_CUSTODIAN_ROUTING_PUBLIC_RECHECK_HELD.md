# QL-276 — Owner-Recorded Accessibility Evidence Intake, Proof-B Custodian Routing Receipt & Fresh Public Source Recheck (HELD)

## Delivered application change

This build adds a functional **Owner evidence & custody intake** disclosure to the four IT / Management / Analytics / System Status command views. It preserves the modern QL-271–275 dark navy communications style, accessible controls, contextual help, local saved layouts and fixed disabled-preview security boundary.

### 1. Actual on-device accessibility observation intake

- The operator can select one of the five QL-275 owner-review tasks, the observed outcome, device class, assistive method and a bounded non-sensitive narrative from a genuine manual test.
- The UI validates the fields and refuses URLs, contact addresses, obvious credentials and excessively short/long notes. A captured observation is explicitly `OWNER_REPORTED_UNVERIFIED` and includes a browser-local capture time. It is not an identity record or authenticated approval.
- The observations are held only in React memory while this panel remains open. They can be reviewed, replaced by check, cleared, or manually copied in a sanitized packet. **No new browser storage, server data collection or automatic transfer** is introduced.
- The total observed count never changes `OWNER_SIGNOFF_NOT_RECORDED`. An actual owner-signed, device-specific acceptance report and independent reviewer disposition still have to be submitted through the authorized external process.

### 2. Proof-B custodian routing draft/reference

- The operator selects an exact source application and may include only an optional non-secret external receipt reference already supplied by that process. The text is deliberately labeled a **reference CLAIM, not a verified receipt**.
- The page displays the next evidence roles: a source maintainer must publish a genuine signed source Proof-B, an independent key custodian must validate raw bytes, Ed25519/SPKI, ancestry and isolated tenant evidence, a separate witness/reviewer must disposition the original receipts, and the authenticated owner must separately authorize any bounded TEST-only GET.
- **Prepare local routing receipt draft** timestamps a local preparation only; the output remains `DRAFT_NOT_SENT` / `NOT_PERFORMED`. This is not a message or a fabricated custodian acknowledgment. Manual copy does not transmit it.
- No private keys, signer records, customer data, real tenant information, credentials or purported owner identity belong in these fields. No release gate is lifted.

### 3. Fresh public Proof-B source recheck

On **2026-10-31T01:03:05Z**, six publicly readable `main` refs were queried through GitHub's public API. Each source's exact immutable SHA was then queried for `docs/integration/ql246-source-proof.json` (public GET only). No application gateway, home relay, tenant, session secret or auth header was used. All six path checks returned HTTP 404.

| Source / role | New observed `main` SHA | HTTP original Proof-B | Changed since QL-274? |
| --- | --- | --- | --- |
| AI Data Platform / supporting | `79a90aa17c2f04b77b27bd3eca54dbdc50d87fe5` | 404 | No |
| Devil n Dove / business | `b4b6fba16b370ceb2b2378965731fc7ea511fc9b` | 404 | **Yes** |
| Rosie Dazzlers / business | `d722720f5ec7d2c708c163a8b0d3305bf30e354a` | 404 | **Yes** |
| Yard Workers / business | `29378a0c9050652f05882a280445750d4a881074` | 404 | No |
| iCamp / business | `219251ee433d745a236ac19c682a3a453db72463` | 404 | No |
| Rosevear AI Hub / supporting | `3845613bb7b7af6bb4fa97fb10b72c2600ba0e84` | 404 | **Yes** |

The new pinned QL-276 source view, IT System Status proof register and Connections inspector show these results. QL-270 and QL-274 records remain visible as **older historical evidence**, not overwritten to pretend their observations were current. Freshness becomes `RECHECK_DUE` at 24 hours, and an independently detected newer main commit also requires a new public recheck. Client-side rendering makes no source GET.

**HTTP 404 is an original-file exception only.** A future HTTP 200 would still require original raw-byte SHA-256, signed descendant-B proof tied to audited GREEN A, independently pinned Ed25519 SPKI, verified ancestry, nonproduction isolation and signed custodian/witness receipts. Source GitHub publication cannot authorize an authenticated TEST GET. Distinct owner TEST authorization is limited to a named isolated nonproduction tenant, an independently witnessed UTC window of no more than 30 minutes and GET-only health/capabilities, with revocation/rollback plan.

## Security and acceptance ledger

| Gate | Status after QL-276 |
| --- | --- |
| Six application source registry | 6/6 known (not connected) |
| Original Proof-B exists at immutable checked SHAs | 0/6 (HTTP 404) |
| Verified independent Ed25519/SPKI and custodian original receipts | 0/6 |
| Independent witness/reviewer disposition | NOT RECORDED |
| Authenticated owner accessibility sign-off | NOT RECORDED |
| Authenticated owner TEST-only authorization | NOT GIVEN |
| Authenticated gateway GET trials | 0 / NOT RUN |
| Customer data, payment transfer, phone/SMS, callback/dispatch, home relay | OFF |
| Runtime integration release | **DISCONNECTED / HOLD** |

Neither the green software build nor a copied local packet changes these gates. No fake approvals, receipts, signatures, keys, email messages, source repository writes, private connection tests, browser-local evidence persistence or real network traffic are introduced.

## Build verification and promotion

- `npm run verify:ql276`: focused regression suite, old command-assistance/source-ledger tests and QL-276 intake tests.
- `npm --prefix app run test`: full application test suite.
- `npm --prefix app run build`: TypeScript and release bundle.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs`: fail-closed network/persistence/security baseline.
- Promote feature → `dev` after successful PR checks and Cloudflare Workers Builds; promote `dev` → `main` after all required checks; independently verify exact-main 5/5 and the actual Cloudflare Worker `https://rosevear-comms-hub.devilndovelive.workers.dev/` (never the old jfrosevear hostname).

## Next proposed build

**QL-277 — Owner Accessibility Recheck Comparison, Custodian Reference Validation Queue & Six-App Source Drift Notification Audit (HELD).** Keep source publication, independent custody and owner TEST authorization distinct; release only after genuine evidence and recorded approvals.
