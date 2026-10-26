# QL-210 — Complete Application Acceptance & Four-Company Release Readiness

Release marker: `ql210-four-company-application-acceptance-disabled-preview-v1`

## Scope

The QL-191–210 operator-console roadmap closes with an **executable fictional acceptance matrix** accessible under **Safety & hold review** for all four organizations. QL-210 checks the actual existing preview models in process, without contacting a provider or database:

1. Canonical company-scoped inbox fixture uniqueness and isolation (QL-192).
2. Explicit same-company Customer 360 links and cross-company lookup rejection (QL-193).
3. In-memory follow-up updates, local receipts, calendar dates/reminders and cross-company holds (QL-194/197).
4. Mock missed-call/voicemail entries and keypad filtering (QL-195).
5. SMS/MMS composer targets, consent/marketing denials and cross-company recipient protection (QL-196).
6. Four-company allowed connector handoffs and forged-source rejection (QL-200–205).
7. Fictional role, company, campground and YW property policy tests (QL-206).
8. Offline versioned checkpoint, duplicate suppression, stale update and foreign scope holds (QL-207).
9. Operator-facing gateway scenario holds for duplicate events, invalid signature projections and outbound denial (QL-208).
10. Tenant-scoped fictional reporting, simulated cost-budget holds and foreign-persona denial (QL-209).

The suite returns **10 synthetic checks per company / 40 expected checks**. Actual results must be obtained from tests and the current browser; this document alone is not an attestation. The UI supports rerunning, a four-company status summary, navigation to demo workspaces, a searchable category of QL-181 live-pilot holds and contextual ⓘ Help. The suite does not grant permissions or record owner signoffs.

## Evidence boundaries

- A `PASS_SYNTHETIC` proves only the named deterministic fixture/programming contract in this release. It does **not** verify actual operator identity, backend RLS, a real carrier signature, physical device, current provider price, customer consent, customer data, real message delivery or complete accessibility.
- QL-188 and QL-208 separate Node CI signature/security harnesses remain distinct from browser projections; QL-210 never claims to authenticate a real provider.
- The 12 QL-181 prerequisites remain **HELD_UNVERIFIED**, including independent human security review, server identity/MFA, brand/tenant RLS, retention/consent, incident and rollback controls, a selected provider, and out-of-band owner authorization. QL-190 remains a draft external-review packet for the two historical brands. Four-company live-pilot governance needs separate review.
- No external reads/writes, Supabase migrations, telephone calls, SMS/MMS, automation, number forwarding/porting, live telephony secrets, approval capture or provider purchases are added.
- QL-198/209 reports contain only invented sources, illustrative targets and fictional costs, not actual business analytics or reliable supplier quotes.
- A GREEN GitHub `main` build/deploy means **disabled-preview release checks passed**, not that the system is safe or authorized for live operations.

## Build and release acceptance

From `app/` run `npm run check`, `npm test -- --reporter=dot --testTimeout=15000`, `npm run build` and `npm run pages:build`. QL-210 unit tests verify all four organizational suites, result counts, non-authorization flags and 12 persistent prerequisite holds. UI tests inspect the acceptance screen across four company selections, ⓘ Help, filters and navigation.

Release requires successful feature branch CI, controlled merge to `dev`, controlled merge to `main`, exact-main build/deployment checks and an actual served QL-210 release marker on the public disabled preview. These external verification steps cannot be simulated or asserted from the browser itself.

## Recommended future work (not previously queued)

The established QL-191–210 roadmap ends at this build. If the owner wants an additional work queue, a **proposed QL-211 — Owner-Observed Four-Company Trial & Readiness Gap Triage** would collect *non-sensitive, synthetic* operator feedback from real devices, document accessibility/usability gaps, and prioritize privacy/security/integration work for separate approval. This is a **proposal**, not an authorized live-pilot activation.
