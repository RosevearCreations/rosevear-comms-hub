# QL-316 — Contact 360, Consent Readback & Four-Business Intake Visual Alignment

## What changed in the disabled preview

- The existing Customer 360 and Guided Intake screens now share a visual language: navy cards, business-specific accent colours, text-first status badges, source labels, large controls and responsive layouts. No replacement workflow or real customer system was introduced.
- Each fictional contact has a visible **UNVERIFIED IDENTITY** summary, a contact-wide restrictive consent badge, per-source consent labels and a reminder that duplicate suggestions are **not confirmed matches**.
- The four business-specific intake forms now display a 0–4 progress bar counting **only valid checked-in fixture choices**. A handoff preview requires all four; changing a selection clears the preview. The simulated review destination and suggested manual verification step use each business's own fixture.
- Every generated handoff remains **UNSENT — INTERNAL SIMULATION ONLY**. Neither quote, availability, booking, customer record nor staff assignment is created.

| Fictional business | Visual workstream | Manual review required (not performed by software) |
| --- | --- | --- |
| Rosie Dazzlers | Vehicle detailing | Size, access and quote scope |
| Devil n Dove | Maker commissions | Design rights, materials, fabrication and timing |
| Yard Workers | Property maintenance | Site scope, equipment access and season |
| iCamp | Campground guest services | Site availability, suitability and campground rules |

## Owner/operator walkthrough

1. Choose one of the four businesses in the operator shell, then open **Customer 360**. The header states the workstream and live-contact-off boundary.
2. Select a fictional profile. Read the **UNVERIFIED IDENTITY** panel and contact-wide consent indicator. Open the **Consent & communication preferences** section to check each linked fixture source. An opted-out source overrides all others; service-only and unknown statuses cannot grant marketing permission.
3. Review linked operator tasks and any **Possible duplicate** card. Review actions are **unsigned local dispositions**, never a merge, identity confirmation or consent change. Use **Open source in unified inbox** for the original fictional thread.
4. Open **Guided intake & quote review**. Check the business-specific scenario and reference, answer four fictional selections and inspect progress. The **Preview internal handoff** action becomes available only when the checked-in questions are valid.
5. Check the **UNSENT** review card and reviewer lane. Edit one selection to confirm the preview disappears. Switch businesses to confirm old answers and previews are not copied to another company. Do not enter actual names, addresses, phone numbers or customer requests.
6. Use **ⓘ Help** on either screen for consent, identity and handoff boundaries.

## Verification and outstanding acceptance

Automated tests cover all four fixture sets, restrictive consent, unverified duplicate indicators, valid/invalid intake progress, UNSENT handoff, change invalidation, business reset and no network/storage side effects. Keyboard focus, forced-colour, reduced-motion and narrow-viewport CSS are included.

The manual screenshot/device and screen-reader walkthrough listed in `docs/visual/ql316-contact-intake-capture-matrix.json` remains **PENDING OWNER OBSERVATION**, not completed by those automated tests.

## External authorization boundary

All six cross-app integrations remain **DISCONNECTED / HOLD**. ACK Delivery Evidence stays **UNDER_REVIEW / PARKED_FOR_LATER**. Software Production GREEN validates a deployed disabled-preview build, not verified contact identity, lawful consent, quote delivery, booking, provider capability, management acceptance, or permission to connect other apps.
