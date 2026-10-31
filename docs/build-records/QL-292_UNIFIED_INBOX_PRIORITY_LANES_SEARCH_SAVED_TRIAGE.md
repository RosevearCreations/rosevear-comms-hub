# QL-292 — Unified Inbox Priority Lanes, Search Precision & Saved Triage Filters

**Scope:** extend the four-organization synthetic communication inbox with coherent attention queues, precise local search, combinable demo filters, safe sort and recoverable tab-only triage presets. This build does not enable a provider, accept original Proof-B, grant access or send a message. Six-App Acknowledgement Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**; six integrations remain **DISCONNECTED / HOLD**.

## Implementation

1. **Priority lane workbench:** five accessible lanes (*All work*, *Priority now*, *Needs response*, *Follow-up*, *Later / resolved*) with exact counts computed from each business's five isolated fictional examples and local follow-up overrides. Deterministic precedence prevents duplicate counting; priority is a demo classification, not a real urgency claim.
2. **Precise search:** AND terms, quoted phrases and `subject:`, `contact:` and `channel:` field hints operate only over synthetic local fields/events. Search ignores case/diacritics and does not issue network calls, infer identities or cross tenants.
3. **Combinable triage filters:** original unread/needs-reply/follow-up and channel selectors work with new priority, demo-owner, disposition and lane filters. Sort controls use attention-first, subject A–Z or channel A–Z with stable deterministic ties. The empty state explains how to recover safely.
4. **Owner and next-review clarity:** all 20 original fictional threads have explicit demo-desk, demo-specialist or unassigned markers and a safe textual next-review suggestion. These are **not real staff assignments or permitted provider actions**.
5. **Two recoverable triage views:** *Desk focus* and *Follow-up review* capture only filter settings in React state owned by the operator shell. A saved view can be restored after navigating to another screen within the same tab and business. Restore checks version, shape, search bounds and organization; unsupported or wrong-brand values fail closed to safe defaults. Switching businesses clears both slots, and refresh clears them. There is no new browser storage key or data persistence.
6. **Accessibility and visual fit:** information-rich command cards, explicit labels, 44px targets, contextual ⓘ help, responsive lanes, focus-visible outlines, reduced-motion and forced-colors support. The original disabled send composer and clear unknown-consent warnings remain visible.

## Safety boundary

- No real message, mailbox, phone, dispatch, customer record, provider webhooks, payment, telemetry, authenticated gateway GET or third-party communication is read, written or sent.
- The four businesses remain isolated; AI Data Platform and Rosevear AI Hub are supporting sources, not customer tenants.
- Local review flags and named filter views are transient demonstration state. They cannot be interpreted as actual assignments, consent, audits or ownership acknowledgements.
- ACK Delivery Evidence remains **Under Review**, without `HELD` status being reinstated. No signed source witness or original custody exception is asserted by this UI build.

## Verification and promotion plan

- `npm run verify:ql292` — QL-292 model/UI, original QL-192 inbox, customer/queue regressions, QL-291 commands and earlier operator suites.
- `npm --prefix app run check`, `npm --prefix app run test`, `node scripts/__tests__/ql171-operator-baseline.test.mjs`, `npm --prefix app run build`.
- Publish the exact tested source tree through guarded feature → `dev` → `main` merges. Record actual production check status and compare live Cloudflare Worker JS/CSS SHA-256 against the local production build before changing the queue count.

## Next planned build

**QL-293 — Conversation Timeline Readability, Unsent Draft Recovery & Contextual Reply Help.** Improve synthetic conversation events and attachment metadata, local unsent draft recovery and explanation of delivery states without ever delivering real communications.

See [the active QL-290–304 queue](../QL-290-304-REQUIRED_BUILD_QUEUE.md). QL-293 becomes next only after QL-292's exact-main Production GREEN receipt is verified.
