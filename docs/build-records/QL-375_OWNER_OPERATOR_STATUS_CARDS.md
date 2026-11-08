# QL-375 — Owner Operator Status Cards, Read-Only Six-App Drilldown & Safe Help Navigation

## Scope and boundaries

The existing personal QL-374 shell, already gated behind an individually authenticated owner session and AAL2 MFA, now offers a six-app source catalogue and a read-only detail panel. Keyboard selection moves focus to the detail heading. The home page displays the owner role, authenticator, membership and protected aggregate six-shell status.

Each catalogue entry maps to the original platform or support **shell** per `docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md`: Yard Workers (`yw`), iCamp (`icamp`), Rosie Dazzlers (`rosiedazzlers`), Devil n Dove (`devilndove`), AI Data Platform (`ai-data-platform`) and Rosevear AI Hub (`rosevear-ai-hub`). Sample landscaping or camping tenants never become source identities.

**Do not interpret catalogue items as six separately verified sources.** The inherited QL-370 protected owner-progress readback only attests a six-shell aggregate. QL-374 enforces session AAL2, matching owner role, 120-second freshness, exactly six held shells, no private TEST authority and consistent membership/audit state. An absent or stale readback is *Unverified*, a discrepancy is *STOP*, and a consistent readback is *HOLD · aggregate verified*. None authorizes operations or source activation.

The three fixed help destinations are (1) protected status refresh `#ql370-refresh-status`, (2) original-owner checklist `#ql371-owner-ceremony`, and (3) published QL-365D mapping on GitHub with safe external-link attributes. There are no new data requests, source probes, write paths, tenant links, credentials, or provider controls. Historical QL-329/331/307/309 preflight figures remain archived as in QL-374, not revived as current release prerequisites. Genuine AAL2 owner decisions and per-source approvals remain required.

## Acceptance and release

- `node --test scripts/__tests__/ql375-owner-six-app-status.test.mjs`
- `cd app && npm run test -- src/auth/__tests__/ql375OwnerStatus.test.ts src/auth/__tests__/ql375OwnerSixAppDrilldown.test.tsx`
- `cd app && bash ../scripts/ql336a-required-gates.sh`
- Protected `dev` and `main` promotion, required check-runs and live Worker asset parity must all pass independently before production is called GREEN.

Branch cleanup must preserve both protected branches and unique unmerged history. Permission to use the GitHub interface does not establish that any deletion has taken place.
