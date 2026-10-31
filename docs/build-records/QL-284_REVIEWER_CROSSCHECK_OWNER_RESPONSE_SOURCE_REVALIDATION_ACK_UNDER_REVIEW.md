# QL-284 — Independent reviewer cross-check, Proof-B owner response claims & six-app source revalidation

**Scope:** software-only independent reviewer trust-reference cross-check, publication owner response reference intake and a fresh immutable six-source Proof-B public GET audit. **Six-App Acknowledgement Delivery Evidence Preconditions remain UNDER REVIEW / PARKED FOR LATER**. This workstream is not being advanced, and the unrelated original integration security protections remain **DISCONNECTED / HOLD**.

## Verified public GitHub observations

On **2026-10-31T13:31:38Z (09:31 Eastern)**, the six public `main` refs were independently resolved and `docs/integration/ql246-source-proof.json` was requested at each **exact immutable SHA**. All six returned GitHub HTTP 404 / Not Found. No private source gateway or signer, owner, reviewer or custodian account was accessed.

| Application / public repository | Previous QL-283 immutable main SHA | Actual QL-284 immutable main SHA | QL-283→284 SHA | Pinned original Proof-B |
| --- | --- | --- | --- | --- |
| AI Data Platform (`ai-data-platform`) | `5a0d140a8080f890c90f6eb812ff04fa0a194b13` | `1df63b8f4b9995609237a8285fff435c073638c4` | Moved | HTTP 404 |
| Devil n Dove (`devilndove-site`) | `1703e747cc9a20a4348c4cc0d0c6a652acf6cef1` | `6d077326f755fcdb301f1bbf2562dc70e95968a3` | Moved | HTTP 404 |
| Rosie Dazzlers (`rosiedazzlers`) | `df3d1e29ff6797c0535b781881bf5309060c1f87` | `c09e58f07474321df01caa54c7a38f527cdc7873` | Moved | HTTP 404 |
| Yard Workers (`yw`) | `5027fcb6579f09c521bfdae1095efe39d98ffe64` | `5027fcb6579f09c521bfdae1095efe39d98ffe64` | Unchanged | HTTP 404 |
| iCamp (`iCamp`) | `1ddcc00f90445445853291c86558512f6d055e7d` | `3c72ff6e2b187a190a34d9596bd6228053b740ea` | Moved | HTTP 404 |
| Rosevear AI Hub (`rosevear-ai-hub`) | `81b2aa449714539c28fd6f8ee4716075c78d3850` | `81b2aa449714539c28fd6f8ee4716075c78d3850` | Unchanged | HTTP 404 |

**Result:** four moved, two unchanged; six source publication exceptions open. **0/6 accepted original signed Proof-B**. The public pin snapshot requires a new independent GET by `2026-11-01T13:31:38Z`, or earlier if a later source notice, claim or new drift arrives. An HTTP 200 at a later date would establish only path existence, not signer, key pin, owner approval or original custody authentication. The app never automatically polls or revisits the public URL.

## Implemented interface and hard boundaries

1. **Independent reviewer trust reference cross-check:** QL-283 session-only trust drafts remain accessible when switching to QL-284. Seven external gates remain unsatisfied: reviewer identity, original issuer trust origin, independently witnessed SPKI key pin/rotation/revocation, challenge nonce/audience, original witness custody, owner TEST authority, and independent conclusion. The operator may prepare a nonsecret local case reference, but it is `LOCAL_UNVERIFIED_CLAIM`; neither original reviewer nor issuer is authenticated. Forged predecessor gate states fail closed.
2. **Publication owner response intake:** an unresolved, unsent QL-283 source-owner follow-up must exist in this session. Operators can select a *claimed* publication-pending, original-source-provided, or clarification-needed response and store a nonsecret reference locally. All owner identity and response receipts remain `NOT_AUTHENTICATED` / `NOT_VERIFIED`; external contact and routing are false and the publication exception remains unresolved. Selecting an "original source claimed" category never accepts an original artifact.
3. **Six-app immutable Proof-B source revalidation:** accessible public pinned-source ledger and moved/unchanged filters, snapshot age, next due and source-notice drift. Optional local manual follow-up requires an existing unexecuted QL-283 manual recheck worklist draft; it creates no public GET, external schedule, owner contact or source integration. The actual independent public GET observations are separate from these new local worklist drafts.
4. **ACK evidence:** explicitly **UNDER REVIEW / PARKED FOR LATER**. No new acknowledgement delivery evidence, receipt attempts, notification, aging, escalation or message routing. Historical unverified ACK reference claims are not accepted. The parked decision must not be confused with waiver of the six-source original Proof-B / authenticated gateway / owner TEST security gates, which remain **DISCONNECTED / HOLD**.
5. **Data handling:** all new drafts live only in React memory during the current session, with explicit clear and read-only copy-only packet. No secrets, private key operations, new browser persistence, credentials, calls, SMS, TEST-tenant authenticated GETs or external sends.

## Release acceptance gates

- `npm run verify:ql284`: QL-284 tests and all prior QL-283–QL-270 operator regression coverage.
- `npm --prefix app run test`: complete app suite.
- `node scripts/__tests__/ql171-operator-baseline.test.mjs`: operator security baseline.
- `npm --prefix app run build`: TypeScript check and production Vite bundle.
- Exact code tree through feature → `dev` → `main`, successful feature/dev required checks, five successful `main` checks, and equality of deployed Worker HTML JS/CSS SHA-256 to final local production assets.

## Proposed next build

**QL-285 — Reviewer Issuer Trust Authority Challenge Audit, Proof-B Owner Response Provenance Reconciliation & Six-App Publication Exception Delta Worklist (ACK Delivery Evidence Under Review).** Future reviewer/owner evidence must be independently obtained; this proposal does not assert it exists.
