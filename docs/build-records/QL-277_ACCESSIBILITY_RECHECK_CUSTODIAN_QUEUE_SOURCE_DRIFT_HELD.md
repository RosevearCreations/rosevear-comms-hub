# QL-277 — Owner Accessibility Recheck Comparison, Custodian Reference Validation Queue & Six-App Source Drift Notification Audit (HELD)

## Actual interface changes

QL-277 extends the existing four IT, Management, Analytics and System Status command views with a **Recheck & source drift audit** disclosure. It reuses the real QL-271–276 dark navy/violet/cyan screen style, contextual help, named local display profiles, focus, reduced motion, forced-colour and mobile layouts.

### Owner accessibility baseline and recheck

- Capture a genuinely observed baseline and then a later observation for one of the five QL-275 accessibility checks. Both use the bounded, non-secret QL-276 evidence validator.
- A comparison identifies **reported improvement**, **reported regression**, **unchanged**, **unresolved issue**, **environment mismatch** or **incorrect time order**, based on observed result, device/method and timestamps. It never claims an independently measured accessibility pass or automatic closure.
- QL-276 observations deliberately were session-only; this screen cannot silently read a closed prior session. The owner must record a new baseline, then a subsequent recheck. Manual device/reader testing, authentic identity and independent reviewer disposition remain required.
- Comparisons and notes are memory-only, not customer data, storage records or server-bound events. Copy and clear are available. A full set of successful self-reports **does not** authenticate the owner or certify accessibility compliance.

### Independent custodian reference validation queue

- Select a specific source repository and optionally enter an externally issued, non-secret receipt reference. The QL-276 format validator rejects malformed and secret-like references.
- Queue outcomes distinguish `NO_REFERENCE` from `FORMAT_VALID_ONLY`. Both retain `SOURCE_PROOF_404_CUSTODY_UNVERIFIED` and `DRAFT_NOT_SENT`. The UI cannot verify an original Ed25519 signature, independently pinned SPKI, immutable source hash, ancestor A → descendant B, witness or the real receipt issuer.
- No route is sent. A new reference is not a receipt, and neither a populated queue nor a successful software build can authorize a gateway request. Actual independent custodian verification and owner TEST-only authorization are distinct external decisions.

### Six-app drift notifications

- Read-only public GitHub `main`-ref GETs followed by exact immutable source-proof-path GETs provide the new status. The UI shows old → new SHA, HTTP outcome, 24-hour snapshot age and pinned GitHub links.
- An operator can prepare a source-specific **DRAFT_NOT_SENT** notification for the source maintainer and independent custodian. It is copied only as part of the local review packet; no GitHub issue, email, alert service or private network relay is created.
- Source drift is *not* signed proof: a newer GitHub commit can change public code while original Proof-B, custody and authorization all remain absent. Recheck an even newer main ref or a snapshot older than 24 hours independently.

## Real public recheck and application-by-application exception register

At **2026-10-31T01:50:32Z**, the source repositories' then-current public `main` refs were read, then the exact immutable path `docs/integration/ql246-source-proof.json` was fetched via read-only public GitHub requests at each SHA. All six results were HTTP 404. **All six source commits changed** since the QL-276 check at 01:03:05Z.

| Application / role | Previous QL-276 SHA | Fresh QL-277 SHA | Original signed Proof-B | Notification |
| --- | --- | --- | --- | --- |
| AI Data Platform / supporting | `79a90aa17c2f04b77b27bd3eca54dbdc50d87fe5` | `73842314ae77af0826c6403d851dbdd58ae964fe` | HTTP 404 | DRAFT_NOT_SENT |
| Devil n Dove / business | `b4b6fba16b370ceb2b2378965731fc7ea511fc9b` | `5d4050864170d0563ca85540cefe3c713223ae00` | HTTP 404 | DRAFT_NOT_SENT |
| Rosie Dazzlers / business | `d722720f5ec7d2c708c163a8b0d3305bf30e354a` | `1acc859fde21d600d28d9379d675de0d3f5e990f` | HTTP 404 | DRAFT_NOT_SENT |
| Yard Workers / business | `29378a0c9050652f05882a280445750d4a881074` | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | HTTP 404 | DRAFT_NOT_SENT |
| iCamp / business | `219251ee433d745a236ac19c682a3a453db72463` | `883ee518e805253f45c316ce380ba13723182ff3` | HTTP 404 | DRAFT_NOT_SENT |
| Rosevear AI Hub / supporting | `3845613bb7b7af6bb4fa97fb10b72c2600ba0e84` | `1ffb37c4eb750b4c8969b44f76692c74845179bb` | HTTP 404 | DRAFT_NOT_SENT |

These are immutable historical GitHub results, not authenticated gateway health checks or original signer verification. QL-270, QL-274 and QL-276 observations remain separately visible in the Connections inspector and their audit files; QL-277 is the latest dated public observation at release time, not an automatic live polling feed.

## Non-bypassable release and approval status

| Gate | QL-277 state |
| --- | --- |
| Registered source repository mappings | 6/6 known |
| Original signed Proof-B at the six checked SHAs | 0/6, HTTP 404 |
| Independent signer/Ed25519/SPKI, custody receipt and witness acceptance | 0/6, NOT VERIFIED |
| Authenticated owner accessibility and reviewer disposition | NOT RECORDED |
| Owner TEST-only permission for named isolated tenant, ≤30-minute UTC GET-only window | NOT GIVEN |
| Authenticated gateway GETs | NOT RUN |
| Real phone/SMS, callbacks, customer data, live analytics, payments, private relay | OFF |
| Six-source runtime integrations | **DISCONNECTED / HOLD** |

A future public HTTP 200 would establish only file existence. A genuine canonical Proof-B tied to a GREEN audited A and signed B, exact raw SHA-256, independently trusted Ed25519 SPKI, separate original custody/witness receipts and actual owner TEST-only authorization would still be required. No private app, source repo, gateway, owner account or Windows server write is included in this release.

## Verification and promotion sequence

- `npm run verify:ql277` — QL-277 comparison/reference/drift regression plus QL-276/275/274 and base operator view tests.
- `npm --prefix app run test` — entire application suite.
- `npm --prefix app run build` — TypeScript/Vite production assets.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs` — fail-closed reviewed browser persistence/network/preview deployment checks.
- Merge feature to `dev` after application CI and Workers success; verify `dev` Workers; merge `dev` to `main` after PR CI; check exact-main 5/5 production jobs and actual Cloudflare Worker `https://rosevear-comms-hub.devilndovelive.workers.dev/` for the matching QL-277 compiled bundle.

## Next planned build

**QL-278 — Owner Accessibility Regression Retest Queue, Original Custody Receipt Verification Preconditions & Six-App Drift Follow-Up Aging (HELD).** It must preserve separate signed proof, independent custody, witness and owner TEST authorization gates until originals genuinely exist.
