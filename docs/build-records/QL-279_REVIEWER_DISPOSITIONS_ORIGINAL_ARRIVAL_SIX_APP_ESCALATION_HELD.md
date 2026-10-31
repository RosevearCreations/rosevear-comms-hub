# QL-279 — Independent Accessibility Reviewer Retest Dispositions, Original Custody Artifact Arrival Watch & Six-App Escalation Follow-Up (HELD)

## Shipped interface and operator workflow

QL-279 adds **Reviewer decisions & custody watch** to the actual IT, Management, Analytics and System Status command help toolbar. Its responsive navy/violet/cyan command cards inherit the current theme, labelled form fields, keyboard focus, forced-colour and reduced-motion support. The QL-273–278 help/shortcuts/profiles/history remain available.

### 01 · Independent accessibility reviewer disposition intake

- QL-278 open regression tickets now live at the common command-assistance level, **in browser memory only**. An operator can switch from QL-278's genuine local baseline → comparison → retest queue to QL-279's review desk without losing open tickets. No prior closed-session ticket is claimed to have been recovered.
- A real open ticket is required before a reviewer disposition can be prepared. The UI accepts a **non-secret, externally issued reviewer record reference claim** (5–32 characters), a bounded 8–240 character nonsensitive review reason, and one of three provisional outcomes: `EVIDENCE_INCOMPLETE`, `RETEST_REQUIRED`, or `NO_ISSUE_CLAIM_NEEDS_WITNESS`.
- The no-issue proposal requires a recorded later comparable QL-278 retest with `outcome: observed`. Invalid/secret-like references, contact details, URLs, suspicious credential content, missing notes or invalid timestamps are rejected.
- Every item remains `INDEPENDENT_REVIEWER_CLAIM / NOT_AUTHENTICATED / REVIEW_DRAFT_ONLY / OPEN / accepted:false / DRAFT_NOT_SENT`, even when a reviewer reference or no-issue retest is recorded. No real independent reviewer identity, signature, witness, WCAG certification, owner sign-off or ticket closure is manufactured.

### 02 · Original custody artifact arrival watch

- Fresh public GitHub source recheck, immutable SHA and HTTP outcomes are available for all six apps. Each source is pinned to the exact commit below; all returned HTTP 404 at `docs/integration/ql246-source-proof.json`.
- Three separately routed **arrival notice claims** can be recorded: original source publication notice, independent original custodian return notice, or independent original witness return notice. Each requires a non-secret claim reference and is clearly `CLAIMED_NOT_CONFIRMED / originalVerified:false / PUBLIC_PROOF_404_CUSTODY_UNVERIFIED / DRAFT_NOT_SENT`.
- The QL-278 seven original evidence conditions remain visible and **0/7 verified**. A human must independently obtain the original signed Proof-B, raw SHA-256, audited A→B, Ed25519 and independent SPKI pin, original custody receipt, original witness disposition, named isolated TEST tenant and authenticated owner ≤30-minute UTC GET-only permission.
- The application does not ingest original signed documents, key material, credentials, receipts or a private custodian API; it only prepares human follow-up drafts.

### 03 · Six-application escalation follow-up

- The six-app public source ledger tracks QL-278 → QL-279 moved/unchanged main SHAs, missing original proof and time-since-QL-277 follow-up. The age categories are `MONITOR`, `FOLLOW_UP_DUE` (≥24h), `ESCALATION_REVIEW_DUE` (≥48h) and `CLOCK_REVIEW`; the QL-279 public snapshot itself requires a new check at 24h.
- Operators can prepare source-specific, unsent escalation drafts for `PROOF_STILL_404`, `ORIGINAL_CUSTODY_UNVERIFIED` or `REVIEWER_DISPOSITION_PENDING`. The suggested human route is source maintainer + independent custodian; no GitHub issue, email, source repository write, Windows relay, background polling or private gateway GET is triggered.
- The read-only consolidated packet can be copied only through direct user action. Clearing QL-279 drafts does **not** wipe open QL-278 retest tickets; those can be cleared through the QL-278 desk. This is **local memory**, not a server audit trail or authenticated evidence intake.

## Real six-app public source recheck

At **2026-10-31T02:33:44Z** the then-current `main` refs were fetched from public GitHub, followed by read-only GETs to the exact source-bound immutable path `https://api.github.com/repos/RosevearCreations/<repo>/contents/docs/integration/ql246-source-proof.json?ref=<SHA>`. All six returned **HTTP 404**. This is an immutable historical observation, not a live app connection, cryptographic signature acceptance or proof of the private custodian's state.

| Application / role | QL-278 public main SHA | QL-279 public main SHA | SHA drift | Original signed Proof-B |
| --- | --- | --- | --- | --- |
| AI Data Platform / supporting | `73842314ae77af0826c6403d851dbdd58ae964fe` | `73842314ae77af0826c6403d851dbdd58ae964fe` | Unchanged | HTTP 404 |
| Devil n Dove / business | `475409185181518f2cf7397562bf39f5043a7850` | `1c3ae46467d2604315c42d0f6515a636129b1928` | Moved | HTTP 404 |
| Rosie Dazzlers / business | `e7e222f5324b931f5de97d0c279f77bc082a9576` | `00727561f2ebba36a3a171e0fe5624e35f9b0ad5` | Moved | HTTP 404 |
| Yard Workers / business | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | Unchanged | HTTP 404 |
| iCamp / business | `883ee518e805253f45c316ce380ba13723182ff3` | `883ee518e805253f45c316ce380ba13723182ff3` | Unchanged | HTTP 404 |
| Rosevear AI Hub / supporting | `11861c13801b395d9be7f8a661fe7ebf8bc25fd5` | `11861c13801b395d9be7f8a661fe7ebf8bc25fd5` | Unchanged | HTTP 404 |

QL-270, QL-274, QL-276, QL-277 and QL-278 immutable observations remain in the Connections inspector and their original audit files; QL-279 becomes the latest dated public snapshot. A further public source commit or aged snapshot must be independently rechecked.

## Release gates that remain strictly HELD

| Independent condition | QL-279 outcome |
| --- | --- |
| Real original source-signed Proof-B at current checked main SHAs | 0/6, pinned public HTTP 404 |
| Audited GREEN A→B ancestry / raw SHA-256 / verified Ed25519 & independent signer SPKI | NOT VERIFIED |
| Original custodian receipt / separate original witness return | 0/6, NOT VERIFIED |
| Independently authenticated accessibility reviewer and device disposition | NOT RECORDED |
| Owner accessibility acceptance / real owner TEST-only authorization | NOT GIVEN |
| Named isolated TEST tenant, scoped identity and ≤30-minute UTC GET-only window | NOT VERIFIED / NOT AUTHORIZED |
| Authenticated gateway GET health/capabilities / real live phone and SMS | NOT RUN / OFF |
| Six-app integration status | **DISCONNECTED / HOLD** |

**Software Production GREEN means only the real app bundle passed its tests, deploy and production checks.** It never means the six apps may exchange customer data, connect gateways, dispatch messages or use an unapproved home-server relay.

## Verification and promotion sequence

- `npm run verify:ql279` — QL-279 public source and reviewer/arrival/escalation guards, integrated React UI and QL-278→279 local ticket sharing, plus QL-278/277/276/275/274/273 and core command tests.
- `npm --prefix app run test` — entire app suite.
- `npm --prefix app run build` — TypeScript and Vite production build.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs` — fail-closed disabled-preview storage, network and release invariants.
- Review the exact tested tree through feature → `dev` → `main`; verify successful application/Cloudflare checks, all five exact-main production checks, and the live Worker JavaScript bundle SHA-256 matching local production assets.

## Next planned build

**QL-280 — Authenticated Reviewer Receipt Preconditions, Original Proof-B Return Reconciliation & Six-App Escalation Acknowledgement Aging (HELD).** Real cryptographic and authorization decisions must still occur with genuine independent evidence and separately authenticated owner TEST-only consent, never with a local draft.
