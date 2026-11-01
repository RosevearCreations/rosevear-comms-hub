# QL-298 — Multi-Line Routing & IVR Scenario Studio with Safe Fallback Review

## Application scope

- Added an Operations workspace with two independent side-by-side scenario panels for owner review.
- Four fictional company-line selections and one unidentified shared line; each company has different new-inquiry and existing-request menu labels.
- Each panel simulates company identification, demo opening hours/holiday closure, answered/no-answer/busy/provider-error outcomes and keys 1, 2, 0, 9 and timeout (#).
- Explicit outcomes: route queue preview, voicemail placeholder, missed-call placeholder, repeat menu, invalid key, timeout, provider-error hold, ambiguous shared-line hold, cross-company hold and malformed-input hold.
- Deterministic decision trace explains source, company gate and fallback. It never reads another company's customer data.
- No phone-number purchase, forwarding, SIP connection, live DTMF, carrier settings, recordings, webhook, SMS, external writes or browser persistence. All scenarios remain fictional and in screen memory.

## Acceptance and promotion

- Focused test: `app/src/operator/__tests__/ql298RoutingStudio.test.tsx` covers all four businesses, key fallback, cross-company ambiguity, no answer and time windows.
- Run full application suite, TypeScript, security baseline and Vite production build before promotion.
- Exact `main` release requires five successful checks and byte-verified public Worker JS/CSS.
- Six integrations remain DISCONNECTED / HOLD, and ACK Evidence stays UNDER_REVIEW / PARKED_FOR_LATER.

**Next queued after verified GREEN:** QL-299 — Operator Accessibility Owner Walkthrough & Cross-Device Regression Queue.
