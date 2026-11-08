# QL-377 — Owner Incident History, Alert Aging & Accessible Resolution Guidance

## Scope

- Add a **bounded observation history** in the individually authenticated Ree/Jack operator shell's I.T. section. This is not a durable incident database, an acknowledgement mechanism, an archive, or an independent six-app source probe.
- Capture displayed incident transitions only when a role-matched, AAL2-authenticated protected owner readback supplies a valid timestamp. No history is fabricated when readback is absent or invalid.
- Keep the latest 40 observations in React memory across operator-shell navigation. Never write to local/session storage, telemetry, database tables, or provider APIs; reset when MFA is lost or the signed-in owner role changes.
- Show how long an observation has been displayed and distinguish **no longer displayed** from **independently resolved**. Reappearance is a new observation, not a reopened server incident.
- Provide keyboard focus, selectable details, a filter for still-displayed versus no-longer-displayed items, category-based safe guidance, and a protected-status refresh link.

## Trust and visibility

The source is the existing protected `QL-370` aggregate and QL-376 derived alerts; timestamps describe observation and original server snapshot, not an issuer-signed event or source attestation. No private Auth identifiers, signing keys, customer records, original-device secrets, or external vendor configuration are stored. Client rendering never authorizes activation, enrollment, private TEST, six-source connectivity, or customer access. Historical preflights remain archival, not prerequisites; current owner and source checks remain fail-closed.

## Verification

1. `npm run test -- src/auth/__tests__/ql377OwnerIncidentHistory.test.ts src/auth/__tests__/ql377OwnerIncidentHistoryUI.test.tsx src/auth/__tests__/ql377OwnerShellNavigation.test.tsx`
2. `node --test scripts/__tests__/ql377-owner-session-history.test.mjs`
3. The QL-377 gates are appended to `scripts/ql336a-required-gates.sh` and the independent `.github/workflows/app-ci.yml` security verifier.
4. Run the complete unchanged QL-336A required-gate chain, TypeScript, asset budgets, and protected `dev` / `main` PR checks. Do not override a failed gate.

**Owner acceptance:** Ree and Jack separately open the operator shell, complete their own MFA, refresh their personal protected status, review recent and stale alert changes, switch sections and return to I.T. to confirm the same in-memory history, and confirm logout or owner switch clears it. No owner signature or private receiver activation is implied by a GREEN software build.
