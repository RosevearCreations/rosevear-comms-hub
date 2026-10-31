# QL-281 — Independent Reviewer Signature Challenge Preconditions, Proof-B Publication Freshness Diff & Six-App Escalation Acknowledgement Custody Review (HELD)

## Actual operator UI

QL-281 adds **Signature, proof freshness & ACK custody** to the existing IT, Management, Analytics and System Status contextual command guidance toolbar. It uses the existing accessible compact navy/violet/cyan cards, status banners, tabs, `ⓘ` help, labelled form fields, keyboard focus, forced-colour and reduced-motion treatment, responsive layouts, and familiar QL-279/280 evidence workspaces. This is an actual React operator workflow, not an independent static report.

QL-280 reviewer reference claims and acknowledgement reference claims are lifted into QL-273 assistance's in-memory session scope. Operators can prepare a claim in QL-279 → QL-280, switch to QL-281, and view its exact nonsecret parent reference without refreshing or losing the active draft. No evidence-related QL-279/280/281 state is written to browser storage, an external backend or source applications. A copy-only read-only audit packet and a **clear QL-281 requests** action do not mutate parent source drafts.

### 01 · Independent reviewer signature challenge

The UI accepts only a valid, still-unverified QL-280 reviewer receipt claim originating from a local QL-279 disposition draft. A new nonsecret external challenge-request reference may be prepared with later chronological ordering. **The UI does not create a nonce or claim to perform a cryptographic challenge.** It shows seven unsatisfied hard preconditions:

1. Independently authenticated reviewer identity, role, independence and signer authority.
2. Original challenge issuer, case and relying-party scope independently verified.
3. Fresh unpredictable nonce, expiry, audience and single-use replay protection.
4. Original signed reviewer disposition and exact raw document digest linked to the retest case.
5. Cryptographically verified challenge response, independent reviewer key pin and identity match.
6. Independent device/accessibility witness, chronology and original custody chain.
7. Separate authenticated owner accessibility acceptance and TEST-only authorization.

Every QL-281 request stays `PRECONDITION_REQUEST_ONLY / NOT_ISSUED / NOT_VERIFIED / DRAFT_NOT_SENT`. Rejected inputs include claims masquerading as authenticated or accepted receipts, mutated QL-280 prerequisite state, secret-like references, invalid clocks and out-of-order timestamps. The UI cannot clear a reviewer issue or grant a signer identity.

### 02 · Six-app Proof-B publication freshness diff

Real, read-only GitHub source observations at immutable `main` refs are compared **QL-280 → QL-281**. Exactly three SHAs moved and three remained pinned; every exact original Proof-B path returned HTTP 404 again. The UI distinguishes source SHA movement, source-file absence, obsolete arrival claims, and notices prepared **after** the latest public observation. A notice newer than the observation is not retrospectively authenticated by a stale GET. Freshness is calculated from the observation timestamp; after 24h it marks `PUBLIC_RECHECK_DUE` without automatically querying any source. Clock skew is explicit (`CLOCK_REVIEW`).

Even an HTTP 200 from a later check would only show a publicly readable file. It would not prove the original canonical signed Proof-B, audited GREEN A→B, raw SHA-256, Ed25519 signature, separately pinned SPKI, independent custodian/witness, named nonproduction tenant trust or owner consent.

### 03 · Six-app escalation acknowledgement custody

The screen displays all six app rows, including apps without any prior acknowledgement claim. A valid QL-280 unverified acknowledgement claim may produce a **nonsecret custody review reference request**. Six custody gates remain unsatisfied:

1. Original outbound escalation plus actual delivery transport receipt.
2. Independently verified authorized destination/recipient identity.
3. Original response plus immutable reply digest.
4. Independently pinned recipient signer and verified response signature.
5. Unbroken message → ACK → case → source SHA chronology and chain of custody.
6. Separate owner retention/acceptance decision and TEST-only authorization.

QL-279 escalations remain UNSENT. A reference claim is not a delivery event; therefore every request remains `NOT_RECORDED / NOT_RECEIVED / BLOCKED_PENDING_ORIGINAL_CUSTODY / DRAFT_NOT_SENT` and 0/6 applications have authenticated custody. No messages, GitHub issues, calls, SMS, webhooks, private relays, source gateway GETs or customer-data writes are performed.

## Actual dated public source proof recheck

At **2026-10-31T03:45:13Z**, the six public GitHub repository `main` refs were fetched with the installed GitHub connector. For each immutable commit, the exact original file GET was attempted at `https://api.github.com/repos/RosevearCreations/<repo>/contents/docs/integration/ql246-source-proof.json?ref=<sha>`. All six returned a GitHub API `404 Not Found` response. No private original or source-authenticated gateway was accessed.

| App | QL-280 immutable main | QL-281 immutable main | Drift | Original Proof-B |
| --- | --- | --- | --- | --- |
| AI Data Platform | `73842314ae77af0826c6403d851dbdd58ae964fe` | `73842314ae77af0826c6403d851dbdd58ae964fe` | Unchanged | HTTP 404 |
| Devil n Dove | `8afba3060d3d53660df28b3b6335d82b34dc0e08` | `9899c273cd41b8cfaf6072809f969954e8303d84` | Moved | HTTP 404 |
| Rosie Dazzlers | `f624afeadcfa64529e3d99e238ada9cbb27fdbc9` | `64829e2d8ebdc49d069fb580c482fcd126af0e1e` | Moved | HTTP 404 |
| Yard Workers | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | `736c79f0ef76375b4ceea2db5921cabfc0c90fe9` | Unchanged | HTTP 404 |
| iCamp | `883ee518e805253f45c316ce380ba13723182ff3` | `883ee518e805253f45c316ce380ba13723182ff3` | Unchanged | HTTP 404 |
| Rosevear AI Hub | `29e1fbe490c020efd34d598c080a7da72c9bffd5` | `1eb0b0216c6d26e7de795339d7e3dbd6ebb9224b` | Moved | HTTP 404 |

These are bounded dated observations, not realtime health checks and not evidence of an original private custodian response. A new SHA, later claimed return, or aged snapshot must be independently checked again.

## Release and security separation

| Gate | QL-281 actual result |
| --- | --- |
| Six source mappings | 6/6 registered |
| Original source-signed Proof-B | 0/6, six HTTP 404 |
| Reviewer original signature challenge | 0/7 prerequisites verified; never issued |
| Independent original Proof-B signer/custodian/witness | NOT VERIFIED |
| Escalation outbound and authentic acknowledgement custody | 0/6, NOT RECORDED |
| Original owner TEST-only authorization | NOT GIVEN |
| Authenticated source health/capabilities GET | NOT RUN |
| Live customer, payment, calls, SMS and private Windows relay | OFF |
| Integration release | **DISCONNECTED / HOLD** |

Production software GREEN verifies that the UI and tests passed. It does **not** imply the original proof, reviewer, owner or tenant integration was authorized.

## Verification and promotion

- `npm run verify:ql281`: QL-281 signature challenge, source diff, ACK custody, shared navigation and QL-280–270 regression tests.
- `npm --prefix app run test`: complete app Vitest suite.
- `npm --prefix app run build`: TypeScript plus Vite production assets.
- `node --test scripts/__tests__/ql171-operator-baseline.test.mjs`: disabled-preview and no-network/no-persistence security invariants.
- Promote tested source tree with feature → `dev` → `main` PRs only after required CI and Workers checks; require all exact main checks GREEN and public live Worker JS checksum identical to tested local asset.

## Next planned build

**QL-282 — Original Reviewer Challenge Issuer Readiness, Proof-B Source Publication Exception Triage & Six-App Acknowledgement Delivery Evidence Preconditions (HELD).** Genuine reviewer signer/custodian/witness originals, owner TEST approval and isolated tenant access remain necessary; no operator reference claim clears HOLD.
