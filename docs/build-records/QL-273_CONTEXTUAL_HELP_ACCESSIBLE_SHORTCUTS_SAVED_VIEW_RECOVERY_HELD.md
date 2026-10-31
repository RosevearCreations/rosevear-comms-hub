# QL-273 — Contextual ⓘ Help, Accessible Command Shortcuts & Saved View Recovery Audit (HELD)

## Shipped interface

- Retains the QL-271 communications-network command shell and QL-272 local profiles, with the generic reference specification's rounded KPI cards, status rails, descriptive sections and responsive disclosure panels.
- Adds contextual ⓘ help to each of the sixteen KPI cards across IT Command, Management, Analytics and System Status. The help distinguishes sourced historical evidence from the fictional training dataset and explains where to drill down.
- Adds screen-level help with purpose, interpretation and next step, plus a keyboard shortcut reference. The four command destinations use `Alt + Shift + 1/2/3/4`; `Alt + Shift + H` opens help; `Alt + Shift + R` opens local recovery; `Escape` dismisses. Shortcuts ignore input fields, textareas, selects and editable regions; normal Tab/Enter/Space navigation is preserved.
- Adds a saved-view recovery audit for the existing QL-272 local browser record. The read-only integrity check differentiates missing, valid, malformed JSON, unexpected schema and unavailable storage. It never reads credentials or returns user data to a service.
- Enables explicit restore only from a format-validated local layout; malformed and unsupported data fail closed to Standard. A deliberate button may replace a corrupt record with safe defaults; an unavailable storage service never receives a false recovery claim.
- Shows a local-only action description, with no pretense of a signed external audit event. No new persistence key or browser network sink was added.

## Scope and safeguards

- Four business workspaces remain isolated fictional demonstration queues; the two supporting systems are registry mappings only.
- Role previews remain visual-only and **never** authenticate the operator or confer app permissions.
- Original signed Proof-B publication, independent signer/custodian acceptance, tenant authorization and nonproduction authenticated GET witness remain **DISCONNECTED / HOLD** for all six applications. No calls, SMS, provider dispatch, customer-data exchange, secret handling, owner decision or live gateway testing is enabled.
- The previous QL-171 source-sink allowlist continues to permit exactly the historical three plus two reviewed QL-272 localStorage operations. This release refines one existing getter rather than adding a new sink.
- Visual reference is interpreted generically for the communications domain rather than importing workshop products, inventory or example business values.

## Verification

1. `npm run verify:ql273` — contextual help, keyboard actions and editable-focus suppression, malformed/unsupported record rejection, safe restoration, storage-denied state and CSS accessibility.
2. `npm --prefix app run test` — full application suite.
3. `npm --prefix app run build` — TypeScript and Vite production build.
4. `node scripts/__tests__/ql171-operator-baseline.test.mjs` — fail-closed storage/network trust boundary.
5. GitHub Actions checks, Cloudflare Workers build and post-promotion read-only page smoke — required for Production GREEN claim.

## Next build

**QL-274 — Command Help Coverage Audit, Operator Preference Accessibility Review & Six-App Proof Exception Freshness (HELD)**: broaden contextual guidance to advanced workspaces, inspect preference accessibility across tablet/mobile/keyboard flow and refresh dated original-proof exception surfaces without activating GET or live communications.
