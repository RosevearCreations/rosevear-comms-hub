# Quo-lite required build queue — QL-164 through QL-170

This is a newly scoped batch following QL-163. The prior build records did not contain an agreed QL-164+ queue. Entries below are proposed implementation scopes and do not grant live-system authorization.

| Build | Required scope | Acceptance evidence |
| --- | --- | --- |
| QL-164 | Synthetic Hold & Owner Authorization Regression Tests | Automated tamper cases in App CI; no live side effects |
| QL-165 | Synthetic Fixture Provenance & Version Pinning | Fixtures have stable identities and explicit drift detection |
| QL-166 | Operator Preview Readability & Accessibility Repair | Clean headings, responsive overflow, keyboard/focus and screen-reader checks |
| QL-167 | Brand Isolation & Synthetic Safe-Read Fallback Regression | Cross-brand leakage and malformed read fall back without writes |
| QL-168 | Unresolved Hold Prioritization & Evidence Summary | Display-only grouping by blocker and prerequisite, with no action buttons |
| QL-169 | Private Owner-Decision Prerequisite & Privacy Review | Document identity, consent, evidence, scope and human approval gaps; no implementation permission |
| QL-170 | Release Receipt Integrity & Queue Reconciliation | Exact-main five-check evidence and next-batch planning trigger |

QL-164 through QL-169 completed their exact-main release checks. QL-170 adds an independently testable receipt verifier that rejects mismatched PR lineage, moved commits, duplicate/skipped/failed checks and queue drift. **After QL-170 itself passes exact-main release verification, zero builds remain in this approved batch. A new planning batch is required before any QL-171+ implementation.** This roadmap does not itself certify QL-170 production readiness; consult the exact-main GitHub release receipt.

Safety boundary for every build: do not enable live Phone/SMS, callbacks, provider sends, AI sends, actual owner sign-off, real hold closure, audit persistence, customer records, browser writes or new database mutations without separate explicit authorization and acceptance evidence.
