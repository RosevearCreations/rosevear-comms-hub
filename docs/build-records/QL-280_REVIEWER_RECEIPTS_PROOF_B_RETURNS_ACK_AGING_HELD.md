# QL-280 — Authenticated Reviewer Receipt Preconditions, Original Proof-B Return Reconciliation & Six-App Escalation Acknowledgement Aging (HELD)

## Actual interface and operator workflow

QL-280 adds **Reviewer receipts & acknowledgement audit** to the actual IT, Management, Analytics and System Status command-help toolbar. It uses the existing responsive navy/violet/cyan design, labelled keyboard-operable inputs, contextual ⓘ navigation, prominent HOLD badges, visible focus, forced-colour and reduced-motion support, and the real QL-272 local operator layout profiles. It does not replace the existing QL-273–279 audit/history panels.

The QL-279 **reviewer disposition drafts**, **original artifact arrival notice claims**, and **escalation drafts** are now carried at the shared command-assistance level and remain available while navigating between QL-279 and QL-280 **in the same mounted browser session**. They are never written to localStorage, IndexedDB, a backend, customer tables or a third-party audit service. A closed session cannot silently recover or forge an external record.

### 01 · Authenticated accessibility reviewer receipt preconditions

QL-280 requires a genuine open local QL-279 reviewer disposition draft. An operator may enter a non-secret externally assigned original receipt reference **claim**, but the receipt remains blocked with **0/6 independent prerequisites verified**:

1. Independently authenticated reviewer identity, role and absence of conflict.
2. Original signed reviewer disposition document, immutable fingerprint and raw SHA-256.
3. Independent trusted reviewer public-key pin and cryptographic signature validation.
4. Original on-device retest check, device/method, timestamp ordering and case ancestry reconciliation.
5. Separately issued original device/accessibility witness record and verification.
6. Separate authenticated owner accessibility acceptance decision.

The UI refuses unknown/forged/accepted QL-279 drafts, malformed or secret-like references, invalid clocks and a purported reference predating its QL-279 draft. It always reports `NOT_PERFORMED / BLOCKED_PENDING_ORIGINAL_SIGNED_REVIEW / DRAFT_NOT_SENT`. It never authenticates an owner/reviewer or closes an accessibility issue.

### 02 · Original signed Proof-B return reconciliation

Six genuine read-only public GitHub main-ref and exact immutable original-proof GETs provide the dated source evidence below. The UI compares QL-279 → QL-280 SHA movement and HTTP outcome, with safe pinned source links. A QL-279 arrival-notice claim can be reconciled only as unverified review work:

- `SOURCE_SHA_MOVED_RECHECK_REQUIRED` when the notice targets an older pinned SHA and predated the new observation.
- `SAME_SHA_STILL_HTTP_404` when the notice and historical source check refer to the same SHA but the original file remains absent.
- `CLAIM_POSTDATES_SNAPSHOT_NEW_RECHECK_REQUIRED` when the notice is newer than QL-280's GitHub observation. The UI cannot use an older HTTP result as evidence for a future notice.

All categories remain `ORIGINAL_NOT_OBSERVED / originalAccepted:false`. A historical public file existence check, even HTTP 200, would not establish a canonical genuine Proof-B signature, audited A→B, exact raw SHA-256, independent SPKI, custody/witness original, tenant trust or owner TEST consent. The current six public paths still return HTTP 404, so there are zero accepted artifacts.

### 03 · Six-app escalation acknowledgement aging

The operator can inspect actual *in-session QL-279 escalation drafts*, calculate **time since draft preparation** and record an optional external acknowledgement reference **claim**. Clear labels distinguish `RECENT_UNSENT_DRAFT`, `FOLLOW_UP_DRAFT_REVIEW_DUE` (at 24h), `ESCALATION_DRAFT_REVIEW_DUE` (at 48h), and `CLOCK_REVIEW`. Because the draft was never delivered, this is **not a recipient response SLA**, real outbound delivery history, or an authenticated acknowledgement.

Each claim remains `REFERENCE_CLAIM_UNVERIFIED / NOT_RECORDED / accepted:false / DRAFT_NOT_SENT`. Missing/secret-like references, forged dispatch status and out-of-order times fail. No new GitHub issues, service messages, email, phone/SMS, queue sink, callback, private relay, Cloudflare binding or authenticated source gateway GET is enabled. The combined source/reviewer/ack packet is read-only and copy-only; clearing QL-280 records does not delete QL-278–279 in-session sources.

## Genuine public original source check

At **2026-10-31T03:04:36Z**, public GitHub `main` refs were fetched read-only, then the exact source-specific URL `https://api.github.com/repos/RosevearCreations/<repo>/contents/docs/integration/ql246-source-proof.json?ref=<immutable-main-sha>` was queried. Every original Proof-B target returned **HTTP 404**. Three source SHAs moved and three were unchanged since QL-279.

| Application / role | QL-279 public `main` SHA | QL-280 public `main` SHA | Source drift | Original Proof-B |
| --- | --- | --- | --- | --- |
| AI Data Platform / supporting | `73842314ae77af0826c6403d851dbdd58ae964fe` | `73842314ae77af0826c6403d851dbdd58ae964fe` | Unchanged | HTTP 404 |
| Devil n Dove / business | `1c3ae46467d2604315c42d0f6515a636129b1928` | `8afba3060d3d53660df28b3b6335d82b34dc0e08` | Moved | HTTP 404 |
| Rosie Dazzlers / business | `00727561f2ebba36a3a171e0fe5624e35f9b0ad5` | `f624afeadcfa64529e3d99e238ada9cbb27fdbc9` | Moved | HTTP 404 |
| Yard Workers / business | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | Unchanged | HTTP 404 |
| iCamp / business | `883ee518e805253f45c316ce380ba13723182ff3` | `883ee518e805253f45c316ce380ba13723182ff3` | Unchanged | HTTP 404 |
| Rosevear AI Hub / supporting | `11861c13801b395d9be7f8a661fe7ebf8bc25fd5` | `29e1fbe490c020efd34d598c080a7da72c9bffd5` | Moved | HTTP 404 |

These are historical immutable public results, not live source application health or a claim about an independent private custodian. The QL-270/274/276/277/278/279 snapshots remain available in the Connections inspector and prior build records. Later source SHAs, newly claimed arrivals and a 24-hour-old QL-280 snapshot require an independent new public recheck.

## Independent release and security gates (still HELD)

| Gate | QL-280 outcome |
| --- | --- |
| Registered source mappings | 6/6 present |
| Original source-signed canonical Proof-B | 0/6, immutable source HTTP 404 |
| Audited GREEN A→B, raw SHA-256, valid Ed25519 and independent signer SPKI | NOT VERIFIED |
| Original separately issued custodian + witness receipts | 0/6, NOT VERIFIED |
| Authentic reviewer role, signed review receipt, device witness, owner accessibility acceptance | NOT VERIFIED / NOT GIVEN |
| Owner TEST-only authorization for isolated named tenant, scoped GET identity, ≤30-minute UTC window | NOT GIVEN |
| Authenticated source gateway GET health/capabilities | NOT RUN |
| Actual external escalation dispatch and authenticated acknowledgement | 0, NOT RECORDED |
| Live phone/SMS, customer-event integration, payments or Windows private relay | OFF |
| Six-source integration state | **DISCONNECTED / HOLD** |

Software Production GREEN means the operator application passed release checks, not that independent cryptographic originals, signer trust, owner consent or any tenant integration is approved.

## Verification and promotion

- `npm run verify:ql280` — original receipt/prerequisite, return reconciliation, ack draft age and shared QL-278–279–280 UI tests, plus QL-279–273 regressions and core IT command tests.
- `npm --prefix app run test` — complete Vitest suite.
- `npm --prefix app run build` — TypeScript and Vite production bundle.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs` — strict fail-closed persistence, network and disabled-preview invariants.
- Promote exact tested source tree through feature → `dev` → `main` only after CI/Workers checks. Verify five successful exact-main production checks and live Cloudflare Worker JavaScript SHA-256 equals the tested local output.

## Next planned build

**QL-281 — Independent Reviewer Signature Challenge Preconditions, Proof-B Publication Freshness Diff & Six-App Escalation Acknowledgement Custody Review (HELD).** Genuine original signer/custodian/witness evidence and separate authenticated owner TEST approval remain mandatory; an operator claim never clears HOLD.
