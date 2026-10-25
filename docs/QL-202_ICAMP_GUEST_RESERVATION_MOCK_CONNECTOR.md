# QL-202 — iCamp Guest & Reservation Connector (Mock)

## Delivered

- iCamp-only handoff panel within the QL-199 Connector Centre, with responsive cards and contextual ⓘ Help.
- Synthetic **Camp Rosevear** example tenant, an isolated second demo tenant with no shared records, and two fictional Camp Rosevear inquiries: tent-site availability (sample SMS) and an event visitor pass (sample website intake).
- Guarded `previewCampHandoff()` function requiring the canonical iCamp mock contract, correct organization, known campground, matching fixture tenant and permitted source channel. The QL-199 iCamp fixture-channel allowlist now includes mock SMS alongside website/email.
- Displays request type, site or event, missing dates, office review, and source conversation jump.
- Explicit holds: **availability not checked, reservation not created, guest pass not issued, gate not granted, payment not requested, reply not sent**.

## Security / private integration boundary

Campground selection in the browser **does not authorize tenant access**. A real implementation needs authenticated campground tenant and role, server-side row-level tenant isolation, object-level site/guest/visitor permissions, accurate date-range capacity and hold timers, payment controls, signed callbacks, auditing, retention, explicit owner approval and negative cross-campground tests. Public preview contains only fictitious data and makes no booking, guest or gate API call. The live telephony and SMS pilot remains disabled.

## Acceptance

From `app/`, run `npm run check`, `npm test`, `npm run build`, `npm run pages:build`. QL-202 tests check two fixtures, tenant mismatch and unknown tenant denial, foreign-business denial, held booking/pass/gate/payment side effects, UI help, source navigation and company resets. Marker: `ql202-icamp-guest-reservation-mock-v1`. Certify GREEN only with all five exact-main checks, source-tree parity and published marker.
