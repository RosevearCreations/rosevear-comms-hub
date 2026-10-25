# QL-201 — Devil n Dove Custom Order & Commission Connector (Mock)

## Delivered

- Devil n Dove-only maker intake panel within the QL-199 Connector Centre.
- Two synthetic inquiries: a resin colour combination request from the example website form and a lost-wax ring commission from a fictional voicemail description (no audio attachment).
- `previewMakerHandoff()` rejects foreign company contracts, unknown fixture IDs, and sources outside the Devil n Dove allowlist. The QL-199 mock contract now permits the *fictional* voicemail channel as well as website/email.
- Displays request type, project, technique, material requirements, missing deadline, review notes, and a navigation link to the source sample inbox thread.
- Explicit non-actions: no quote created, inventory reserved, production started, media imported, listing published, payment requested or message sent. Responsive styling and circled ⓘ Help.

## Live integration boundary

Devil n Dove website, Etsy, Facebook Marketplace, inventory, customer data, payments, shipping services, telephony, and message provider accounts remain disconnected. A future real adapter needs server-verified authorization, customer consent, approved country/shipping restrictions (Canada-only policy), product/channel requirements, audited read scope, secure webhook validation, idempotency, retention rules, human quote/material/production approval, and a separately authorized private runtime. A browser-selected company never grants permissions. The QL-181 live-pilot holds remain in effect.

## Acceptance

Run `npm run check`, `npm test`, `npm run build` and `npm run pages:build` from `app/`. QL-201 tests cover both cases, foreign-tenant and unknown-fixture rejection, held side effects, responsive navigation, help, and company-switch isolation. Marker: `ql201-devilndove-commission-mock-v1`. Production GREEN requires exact-main five successful checks, matching `dev`/`main` trees and a published bundle containing this marker.
