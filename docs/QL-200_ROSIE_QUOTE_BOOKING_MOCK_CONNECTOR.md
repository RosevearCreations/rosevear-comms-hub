# QL-200 — Rosie Dazzlers Quote & Booking Connector (Mock)

## Delivered

- Rosie-only quote/booking handoff rehearsal inside the QL-199 Connector Centre, behind the existing Rosie organization selection.
- Two explicitly fictional fixtures: a midsize ceramic coating quote enquiry from the sample website thread, and a recurring fleet scheduling question from the sample email thread.
- Pure, allowlisted `previewRosieHandoff()` adapter requiring the precise QL-199 Rosie contract and fixture ids. It rejects foreign organization/contract, unapproved channels and unknown sample ids.
- Normalized inspection card with service, vehicle category, preferred window, manual review notes and a direct jump to the fictional source inbox.
- Responsive layout, `ⓘ Help`, company-switch reset and explicit **not quoted / not checked / not created / not requested / not sent** results.

## What is still blocked

There is **no connection** to `rosiedazzlers.ca`, production quote/pricing APIs, booking calendar, availability locks, Stripe, Supabase customer records or real staff accounts. The fixtures do not authorize a real booking or price. Real integration requires server-side Rosie tenant authentication and roles, explicit customer data consent, verified package/size/seasonal eligibility, authoritative prices and capacity, idempotent booking conflicts, minimal data mapping, callback signature verification, audit and retention policy, and separate owner approval. No provider SMS/call sending or production write is enabled.

## Validation

Run `npm run check`, `npm test`, `npm run build`, and `npm run pages:build` from `app/`. QL-200 tests cover two fixture mappings, non-booking invariants, cross-tenant and unknown-sample rejection, the help panel, source navigation and the absence of Rosie integration in iCamp. Release marker: `ql200-rosie-quote-booking-mock-v1`.
