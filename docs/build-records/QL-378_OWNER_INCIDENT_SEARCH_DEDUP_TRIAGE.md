# QL-378 — Owner Incident Search, Alert Deduplication & Evidence-Aware Triage

## Owner experience

- Search the existing in-memory QL-377 owner observations by title, category, severity, detail or safe next-step guidance. Search remains local to the browser; no network query or saved search profile is created.
- Filter by severity and whether an alert is still displayed or no longer displayed. Clear the search in one action.
- Group repeated alerts by their existing QL-377 incident identity, **without removing any observation**. Display the number of separate occurrences, preserve each observation's timestamps and allow the owner to ungroup them.
- Prioritize active observations requiring evidence verification, action, review and monitoring ahead of historical entries. Classification is a user-interface aid and grants no operational privileges.
- Explain the freshness of the protected aggregate: recent, expiring, expired, future clock discrepancy or unavailable. Even a recent aggregate is **not six independently source-signed live health checks**.
- Preserve keyboard focus on selected details, labels for filters, a screen-reader status count, safe protected refresh navigation, individual episode details and the explicit “no longer displayed ≠ independently resolved” statement.
- Clear any typed search and filter state when personal authentication is lost or the owner identity changes. QL-377's 40-record memory limit and AAL2 owner isolation are unchanged.

## Trust boundaries

No Supabase schema or server audit history is changed; there are no writes, event acknowledgements, provider calls, customer access or private TEST activation. Severity and evidence freshness are derived only from previously verified role-matched protected aggregate observations. The underlying 40 session observations are retained unchanged by grouping, so recurrence is never hidden or declared resolved.

## Checks

1. `npm run test -- src/auth/__tests__/ql378OwnerIncidentTriage.test.ts src/auth/__tests__/ql378OwnerIncidentTriageUI.test.tsx`
2. `node --test scripts/__tests__/ql378-owner-incident-triage.test.mjs`
3. QL-378 verification is mandatory in both `scripts/ql336a-required-gates.sh` and `.github/workflows/app-ci.yml`, with historical QL-336A gate fingerprint preserved.
4. Full source tests, TypeScript, production Vite build, asset budgets, protected `dev` and `main` checks, production Workers build and public JS/CSS SHA-256 parity must pass before declaring GREEN.

Original-owner acceptability still requires separate Ree and Jack login/MFA and live protected status refresh. A GREEN software build is not proof of original-device signature, enrollment, receiver activation or six source connections.
