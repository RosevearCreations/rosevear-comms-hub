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

**Verified Production GREEN:** 1,111/1,111 app tests and TypeScript/security/500-module Vite production build passed. Source tree `5585237394f133654c6099a072903e188a3b4545` advanced through `dev` and [PR #569](https://github.com/RosevearCreations/rosevear-comms-hub/pull/569) to exact `main` code commit `e10cb57ef76154a978cf9daa778a214dea2862bd`. All five exact-main checks succeeded: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview` and `Supabase Preview`.

Public Worker `https://rosevear-comms-hub.devilndovelive.workers.dev/` served JS `index-Coc12vkF.js` SHA-256 `254b4be1a6990ff0415f0f528af7ef709987e976d94448af9f846429ab7daf95` and CSS `index-BJQHWFUE.css` SHA-256 `7bf1b9c8fe31353aa1f638b6517a82edec33464731f6a939d0c246734348f37a`, both byte-identical to the tested local bundle.

**Next queued after verified GREEN:** QL-299 — Operator Accessibility Owner Walkthrough & Cross-Device Regression Queue.
