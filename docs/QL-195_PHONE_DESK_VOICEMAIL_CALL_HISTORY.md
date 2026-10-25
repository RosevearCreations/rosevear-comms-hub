# QL-195 — Phone Desk, Voicemail & Call History

## Scope

QL-195 adds a dedicated **Phone desk** workspace for Rosie Dazzlers, Devil n Dove, iCamp and YW, following the four-company QL-191–198 interface roadmap. This roadmap scope supersedes the alternate proposed QL-195 reply-drafting label in the QL-194 handoff; safe reply drafting remains a separate future item.

- Each company has a distinct **label-only** sample line, without a phone number, carrier account or live routing rule.
- Fictional missed-call and voicemail records are derived strictly from the existing QL-192 organization-scoped inbox fixtures. Counts, history filters, selected record details and inbox/follow-up navigation operate in the browser.
- A twelve-key visual pad accepts at most sixteen keypad characters and supports delete/clear. Dialling is disabled and no input is sent anywhere. The screen does not accept pasted phone numbers.
- Fictional voicemail descriptions can be revealed; there is **no** audio source, real transcript, playback or recording. The unavailable playback button stays disabled.
- Company switching remounts and clears keypad state, selected history and descriptions. No phone-desk state is persisted.
- Responsive layouts, keyboard-focus controls and inline `ⓘ Help` explain the limitations.

## Explicit hold

This release is a **disabled synthetic interface only**, not a telephony integration. Bell Fibe, cell accounts, private/personal lines, providers, DTMF, answering, origination, forwarding, voicemail media, real customer data, webhooks, Supabase reads or writes and provider billing remain untouched. The twelve QL-181/QL-190 pilot prerequisites remain held. A real voicemail player requires verified authorization, privacy/retention and access policies, a secured recording service and separate owner approval.

## Verification

From `app/`: `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run pages:build`. The QL-195 suite checks company isolation, fixture provenance, keypad limits, disabled transport, the text-only voicemail/call-note reveal, navigation and company-switch state reset. Confirm the published Pages bundle contains `ql195-phone-desk-v1`; confirm `dev == main` and five successful checks on the exact final main commit before certifying Production GREEN.
