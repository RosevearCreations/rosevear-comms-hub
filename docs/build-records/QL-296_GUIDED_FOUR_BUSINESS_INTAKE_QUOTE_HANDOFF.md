# QL-296 — Guided Four-Business Intake Cards & Quote Handoff Preview

## Implemented scope

- New `Guided intake & quote review` Operations workspace with four company-specific training flows.
- Separate deterministic fictional fixtures for Rosie Dazzlers (vehicle and utilities), Devil n Dove (process, material, design and timing), Yard Workers (service, property, access and frequency), and iCamp (stay, party, travel window and amenity).
- Required-choice validation denies unknown fields, invalid options, incomplete answers and cross-company handoffs.
- Once all required choices are valid, an operator may stage an **unsent internal review card**, naming the fictional review destination and listing the selected categories. Editing or clearing discards the card.
- The display carries explicit synthetic-only warnings and no real customer information fields. No booking, quote issuance, payment, dispatch, notification, export, browser persistence, provider call or supporting-app connection is implemented.

## Verification and release gate

Focused test: `app/src/operator/__tests__/ql296GuidedIntake.test.tsx`.
**Production GREEN:** 1,099/1,099 app tests, TypeScript, QL-171 security baseline and 494-module production Vite build all passed. Feature tree `8c0619d9b3d5bf407990d37569435eb75855669b` was applied to `dev`; [PR #566](https://github.com/RosevearCreations/rosevear-comms-hub/pull/566) merged to exact `main` code commit `ea2200a9bf579a730cecde3118ab493e94cd30a4`.

All five exact-main GitHub checks succeeded: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, and `Supabase Preview`. Public Worker `https://rosevear-comms-hub.devilndovelive.workers.dev/` served `index-3p0LZqmz.js` with SHA-256 `783bce43ca9b85296d62e4a8953de474ca1695b6f27be46c12afcf4654e2f594` and `index-Pp4gZ0QQ.css` with SHA-256 `47039213c070acf3b8a229c32953c5370a4aad8ed6e5b5f469acdf802022c769`; both were byte-identical to the tested local production bundle.

Next queued after verified release: **QL-297 — Omnichannel Event Timeline Simulator, Delivery Error States & Replay Recovery**.

ACK Delivery Evidence remains UNDER_REVIEW / PARKED_FOR_LATER; all six integrations remain DISCONNECTED / HOLD.
