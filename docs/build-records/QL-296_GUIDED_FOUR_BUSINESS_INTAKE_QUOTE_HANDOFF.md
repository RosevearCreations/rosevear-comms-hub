# QL-296 — Guided Four-Business Intake Cards & Quote Handoff Preview

## Implemented scope

- New `Guided intake & quote review` Operations workspace with four company-specific training flows.
- Separate deterministic fictional fixtures for Rosie Dazzlers (vehicle and utilities), Devil n Dove (process, material, design and timing), Yard Workers (service, property, access and frequency), and iCamp (stay, party, travel window and amenity).
- Required-choice validation denies unknown fields, invalid options, incomplete answers and cross-company handoffs.
- Once all required choices are valid, an operator may stage an **unsent internal review card**, naming the fictional review destination and listing the selected categories. Editing or clearing discards the card.
- The display carries explicit synthetic-only warnings and no real customer information fields. No booking, quote issuance, payment, dispatch, notification, export, browser persistence, provider call or supporting-app connection is implemented.

## Verification and release gate

Focused test: `app/src/operator/__tests__/ql296GuidedIntake.test.tsx`.
Full app tests, TypeScript, QL-171 security baseline and production Vite build are required before merge. `dev` and exact `main` Git checks plus Worker live asset-byte comparison are required before any Production GREEN claim.

Next queued after verified release: **QL-297 — Omnichannel Event Timeline Simulator, Delivery Error States & Replay Recovery**.

ACK Delivery Evidence remains UNDER_REVIEW / PARKED_FOR_LATER; all six integrations remain DISCONNECTED / HOLD.
