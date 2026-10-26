# QL-209 — Reports, Analytics & Cost Controls

Release marker: `ql209-company-tenant-analytics-and-cost-controls-mock-v1`

## Delivered functionality

The existing QL-198 Reporting Centre now includes a QL-209 workbench, preserving QL-198 company-level fictional inbox reporting alongside a **strictly connector-scoped** view of QL-200–203 handoffs.

- Four organizations: Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers.
- QL-206 fixed demonstration personas control whether an invented handoff is visible. iCamp campground and Yard Workers company/property boundaries are applied per canonical QL-204 item; foreign personas and isolated tenants receive **no scoped counts or cost totals**.
- Channel mix, high-priority and waiting/reply counts are derived from canonical fictional source/thread links. A 30-minute high-priority and 120-minute normal-priority response target illustrates staffing decisions; **neither is a measured duration or a tested service-level agreement**.
- Three invented rate cards reuse QL-187 demonstration numbers without claiming any current carrier price. Operators can adjust simulated monthly traffic (×1/10/50/100), example USD budget, reserve percentage, display currency and hypothetical CAD conversion.
- Cost components are explicit: one imaginary new number and platform, possible voice minutes, possible SMS segments, MMS, reserve and modeled total. Near-budget (80% or greater) and over-budget examples generate local warnings.
- All controls are browser-only; changing companies resets the selected persona and scenario. There is no tracking, export, charging, usage meter sourced from a carrier or backend write.

## Calculations and limits

Each authorized fictional SMS handoff contributes one incoming SMS segment and one *potential outgoing* segment; each fictional voice/voicemail handoff contributes four incoming and two *potential outgoing* minutes. These units are multiplied by the selected sample-volume factor. Other connector channels do not add telecom usage. The QL-187 rates are **deliberately invented** and the output is not a vendor quote.

Subtotal USD = number + platform + other fixed USD + (invented inbound/outbound minutes × invented rates) + (invented SMS segments × rates) + (invented MMS × rates). Reserve is a percentage of subtotal. Display CAD multiplies USD by a user-entered **illustrative**, non-live conversion factor. A warning appears at or above 80% of the entered budget, or above the budget; a zero budget flags any positive cost as over-budget.

Existing Bell Fibe, business mobile and dual-use personal mobile plans **are not included**. Regulatory fees, sales tax, carrier pass-through charges, 911, registration, connection costs and live currency rates are omitted.

## Safety and non-goals

- No provider or Supabase connection, no phone/SMS dispatch, no owner approval and no purchase.
- Browser operator selections are **not real authentication** and cannot grant access to customer records or production systems.
- No customer identity or message body is returned in the scoped analytics. An unknown role, wrong company, wrong campground, wrong YW property or invalid request fails closed.
- The model has no timestamps for real response durations, no historical traffic samples, no verified costs or actual delivery outcomes. Never promote the planning targets or invented volumes to real performance dashboards.
- Existing QL-181 live pilot prerequisites and QL-208 communication gateway disabled boundaries remain in force.

## Verification

From `app/`: `npm run check`, `npm test -- --reporter=dot --testTimeout=15000`, `npm run build`, and `npm run pages:build`. The QL-209 test suite asserts four-org scope, campground isolation, YW property scoping, canonical-only fixtures, cost arithmetic, budget warnings, invalid/forged inputs and operator workspace interactions.

## Next expected build

**QL-210 — Complete Application Acceptance & Four-Company Release Readiness.** Verify operator workflows, connector safety, accessibility, cross-company/tenant isolation, mock analytics, deployment evidence and a prioritized, owner-reviewed plan for any eventual real-provider pilot. Do not silently activate SMS/calls or production data operations.
