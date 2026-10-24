# QL-181 — Privacy, Roles & Live-Pilot Prerequisite Gate

Status: **release candidate**. Exact-main application/Pages/Workers/Supabase Preview GREEN and public bundle verification remain required for promotion. One remaining queue item: QL-182.

## Implemented

1. `ql181PrivacyPilotGate.ts`: pure, source-pinned, deterministic future-pilot **HOLD** contract with 12 explicit unverified privacy/security/telephony/owner prerequisites; each has a responsible external reviewer and a checked-in source-path evidence pointer.
2. A role *illustration* reconciled to QL-009 `owner`/`admin`/`staff_readonly` plus `signed_out`; mock-only projected capabilities are separate from authenticated role enforcement. Every live capability is always denied for every role.
3. `Ql181PrivacyPilotGatePreview.tsx` in **Safety & hold review**: visible hold counters, current risks, accessible expandable `ⓘ` details, sample roles, explanation-read checkboxes, clear button, explicit zero live/approval counters. Checks only mark explanations read in React memory. Brand switch clears local state.
4. `ql181-privacy-pilot-gate.css`: responsive and forced-colors styles plus visible keyboard focus.
5. `docs/QL-181_PRIVACY_ROLES_LIVE_PILOT_DECISION_MATRIX.md`: source audit, 12-row decision matrix, illustrative least-privilege table, official Canadian privacy/CASL and Supabase security references, and independent live-pilot review checklist.
6. Regressions ensure owner role and 12/12 reading never enable live pilot; unknown role, cross-brand scope, tampered fixture, extra fields and duplicate/invalid review IDs fail closed. No fetch, browser storage, Supabase writes, SMS, calls, customer import/export or recorded owner consent.

## Important findings

- Existing QL-004 `localRepository.ts` includes browser localStorage and manual lead export/import. **Do not use for real customer information** until a separately approved secure data platform replaces it. QL-181 adds no new writes or export paths.
- Existing optional `AdminSessionGate` and `AppAdminRole` types do not establish that real production authorization, MFA, or owner consent are verified. This screen cannot inspect or change an actual logged-in user's rights.
- QL-175 consent is `unknown` or synthetic opt-out, never a verified grant. QL-179 mock provider receipts and QL-180 route paths do not provide real authentication/authorization, carrier routing, or privacy compliance.
- All future live-pilot blockers remain `HELD_UNVERIFIED` regardless of a clean QL-181 CI/build result.

## Release verification

1. Under `app/`: `npm run check`, `npm test`, `npm run build`, `npm run pages:build`.
2. Root baseline/receipt gates: `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs`, `node scripts/__tests__/ql170-release-receipt.test.mjs`. No new raw-network, Supabase mutations or provider operations.
3. Promote only the eight reviewed QL-181 files (model, UI, CSS, tests, shell import/mount, decision matrix, build record, updated queue) through feature → `dev` → `main`. Preserve unrelated local worktree changes.
4. Confirm `dev`/`main` tree equality; require exact-main success for `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`.
5. Verify GitHub Pages HTTP200 serves QL-181 gate UI and hard-disabled pilot markers, with no customer/owner data or real phone/SMS introduced.

**Promotion to GREEN attests to a published disabled preview only. It does not clear any live-pilot hold.**
