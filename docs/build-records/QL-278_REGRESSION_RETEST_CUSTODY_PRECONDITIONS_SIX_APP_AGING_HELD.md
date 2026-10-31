# QL-278 — Owner Accessibility Regression Retest Queue, Original Custody Receipt Verification Preconditions & Six-App Drift Follow-Up Aging (HELD)

## Actual production application interface

The real React IT, Management, Analytics and System Status command surfaces now include **Regression retests & proof follow-up**, adjacent to the historical QL-273–277 contextual assistance and audits. It extends the established navy/violet/cyan command styling with labelled keyboard controls, `aria-live` status, responsive tables, visible focus, forced-colour and reduced-motion support. Existing saved views, help and shortcuts are preserved.

### 01 · Owner accessibility regression retest queue

- Capture a new on-device baseline, a later observation of the same accessibility check, and a further comparable retest. The five existing QL-275 checks and bounded QL-276 non-secret input validation are reused.
- QL-277 comparison categorization drives an **open** local ticket: reported regression (`HIGH_REGRESSION`), unresolved issue (`UNRESOLVED_ISSUE`), environment mismatch (`ENVIRONMENT_RECHECK`) or chronological exception (`TIME_ORDER_REVIEW`). A reported improvement or unchanged result is **not** falsely counted as a regression, and still requires independent review for acceptance.
- Retest intake refuses mismatched checks, non-later timestamps and changed device/assistive method. A comparison whose baseline and recheck environments differ cannot be retroactively repaired by a single additional observation; record a new comparable baseline/recheck.
- Even a later reported no-issue retest retains `INDEPENDENT_REVIEW_REQUIRED`, `accepted:false`. No authenticated owner identity, real independent reviewer signature, WCAG certification or automatic closure is claimed. Local notes/tickets are memory-only and explicitly cleared on request; no prior-session observations are silently recovered.

### 02 · Original custodian receipt verification preconditions

A source-specific read-only checklist enumerates seven independent **hard prerequisites**:

1. Original signed Proof-B publicly available at a pinned source revision, with genuine raw HTTP 200 and exact SHA-256.
2. Audited GREEN ancestor A and descendant signed B commit ancestry reconciled.
3. Genuine Ed25519 signature verification against an independently pinned signer SPKI.
4. Independently issued original custodian receipt obtained and verified.
5. Separate original witness receipt/disposition obtained and verified.
6. Isolated named nonproduction TEST tenant independently established.
7. Separately authenticated owner consent for a **≤30-minute UTC GET-only** window.

None is marked verified. The QL-277 receipt reference validator permits at most a non-secret, format-valid **claim**; preparing a source-specific draft cannot authenticate custody or relax any prerequisite. With six HTTP 404s, each draft reports `0/7`, `BLOCKED_ORIGINAL_EVIDENCE_MISSING` and `DRAFT_NOT_SENT`. No real key, signature, receipt, tenant, approval, call, SMS or network sink is created.

### 03 · Six-application source drift follow-up aging

- Genuine public GitHub `main`-ref GETs and exact immutable Proof-B-path GETs are recorded below. Compare QL-277 → QL-278 separately for each app: three moved SHAs, three unchanged, **all six proof files still 404**.
- Tracking begins at the **QL-277 observation time**, not an invented original date of first noncompliance. Elapsed age is reported as `WITHIN_24H`, `FOLLOW_UP_DUE` (24–48h), `ESCALATION_REVIEW_DUE` (≥48h) or `CLOCK_REVIEW`; the **QL-278 source snapshot** independently becomes `PUBLIC_RECHECK_DUE` at 24h.
- The button to refresh elapsed time does **not** query a source; there is no background polling. One source-specific aging follow-up draft can be prepared locally for copy/manual review, but notification dispatch count stays **zero** and every draft says `DRAFT_NOT_SENT`.
- Public SHA movement does not prove signature, accepted custody, tenant isolation or owner authorization. All four businesses and two supporting systems remain `DISCONNECTED / HOLD`.

## Actual public source observations

At **2026-10-31T02:13:35Z**, read-only GitHub API requests observed each source repository's then-current `main`, followed by the immutable URL `https://api.github.com/repos/RosevearCreations/<repo>/contents/docs/integration/ql246-source-proof.json?ref=<40-character-main-sha>`. Every immutable original-source-proof path responded **HTTP 404**. A later GitHub commit or file publication requires a new review and does not change these recorded facts.

| Source role / app | QL-277 main SHA | QL-278 main SHA | Change since QL-277 | Pinned original Proof-B |
| --- | --- | --- | --- | --- |
| Supporting · AI Data Platform | `73842314ae77af0826c6403d851dbdd58ae964fe` | `73842314ae77af0826c6403d851dbdd58ae964fe` | Unchanged | HTTP 404 |
| Business · Devil n Dove | `5d4050864170d0563ca85540cefe3c713223ae00` | `475409185181518f2cf7397562bf39f5043a7850` | Moved | HTTP 404 |
| Business · Rosie Dazzlers | `1acc859fde21d600d28d9379d675de0d3f5e990f` | `e7e222f5324b931f5de97d0c279f77bc082a9576` | Moved | HTTP 404 |
| Business · Yard Workers | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | Unchanged | HTTP 404 |
| Business · iCamp | `883ee518e805253f45c316ce380ba13723182ff3` | `883ee518e805253f45c316ce380ba13723182ff3` | Unchanged | HTTP 404 |
| Supporting · Rosevear AI Hub | `1ffb37c4eb750b4c8969b44f76692c74845179bb` | `11861c13801b395d9be7f8a661fe7ebf8bc25fd5` | Moved | HTTP 404 |

These are dated public observations, not live production integration checks, authentic original Proof-B receipts or independent cryptographic verification. Previous QL-270/274/276/277 immutable snapshots remain in the Connections panel and audit files. The latest QL-278 source link is exposed there too.

## Separate release / authorization decisions

| Independent gate | QL-278 result |
| --- | --- |
| Six registered source mappings | 6/6 identified |
| Original signed source Proof-B at checked SHAs | 0/6; all HTTP 404 |
| Independently verified signed A→B, Ed25519/SPKI, original custody and witness | 0/6; not performed |
| Owner accessibility sign-off and independent reviewer disposition | NOT RECORDED |
| Authenticated owner TEST-only approval, ≤30-minute UTC GET-only scope | NOT GIVEN |
| Genuine isolated TEST tenant and identity | NOT VERIFIED |
| Authenticated gateway health/capabilities GET | NOT RUN |
| Calls, SMS, payments, customer-data sharing, private relay, production integrations | OFF |
| Software deployment on `main` | CI and production Worker promotion **checked separately** |
| Integration approval | **DISCONNECTED / HOLD** |

Software Production GREEN is a deployment quality status, **never** signed source proof, custody, accessibility acceptance or approval to connect an app.

## Verification and production promotion

- `npm run verify:ql278` — new pure and interactive QL-278 cases plus QL-277/276/275/274/273 and baseline command UI regressions.
- `npm --prefix app run test` — entire Vitest application suite.
- `npm --prefix app run build` — `tsc --noEmit` and Vite production bundle.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs` — fail-closed operator preview, network/storage and release invariants.
- Promote exact tested tree to feature branch, merge to `dev` after CI, then `dev` → `main` after CI. Verify **five exact-main successful checks** and the actual deployed Cloudflare Worker JS checksum against local compiled production output.

## Next planned build

**QL-279 — Independent Accessibility Reviewer Retest Dispositions, Original Custody Artifact Arrival Watch & Six-App Escalation Follow-Up (HELD).** No integration can advance without genuine original independently verified artifacts and separate, authenticated, narrowly scoped owner TEST consent.
