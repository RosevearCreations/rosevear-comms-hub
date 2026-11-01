# QL-293 — Conversation Timeline Readability, Unsent Draft Recovery & Contextual Reply Help

**Scope:** improve readability and usability of the already-disabled fictional operator inbox timeline and SMS/MMS studio. There is no live provider, real customer message, private gateway GET, approval, external send, file upload or additional persistence. Six-App Acknowledgement Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**, and the six integration sources remain **DISCONNECTED / HOLD**.

## Implemented operator experience

1. **Readable event cards:** each of the four business contexts shows meaningful event type, source label, illustrative relative ordering and explicit simulation state. Inbound examples, call scenarios and internal notes remain distinct; no fabricated real provider telemetry, timestamp or delivery receipt is implied.
2. **Accessible event filtering and recovery:** select the event kind within the current fictional thread, with a useful empty-state action to restore all event categories. Existing synthetic search, priority lanes and triage presets stay available.
3. **Attachment metadata clarity:** MMS fixtures show a *fictional photo description only* card with `stored: false`. There is no media object, URL, bytes, file selection, upload or third-party access.
4. **Contextual ⓘ reply help:** thread-specific guidance distinguishes opt-out, service-only and unknown consent; explains the no-send boundary alongside the blocked composer. There is no consent grant, marketing authorization or hidden callback action.
5. **Unsent draft recovery:** the four-business SMS/MMS studio keeps separate, scoped, version-checked draft previews in **React memory only** while navigating between workspaces in the same tab. Typed text is bounded to 500 characters and familiar email/phone/URL/key patterns are redacted *before staging*. The recovered state includes fictional thread, purpose, approved sample template and attachment-description selection, always `UNSENT_SIMULATED`.
6. **Explicit discard and isolation:** clearing a draft removes its session entry. Changing businesses clears *all* draft entries; reloading also clears them. Unsupported, cross-organization, unredacted or malformed entries fail closed. The existing disabled send, schedule and file-upload buttons remain disabled, and restrictive linked opt-outs still control displayed consent guidance.
7. **Information-rich interface:** command-style source strips, responsive event cards, readable type/state labels, 44px controls, visible keyboard focus, reduced-motion and forced-colors support.

## Privacy and security constraints

- Do not type real personal information into the preview. Redaction is a secondary demonstration guard, not permission to process customer messages.
- No `localStorage`, `sessionStorage`, new API requests, database, telemetry, file writes, media blobs, provider identifiers or customer exports are added by this build.
- Session drafts are **not** actual sent/approved messages, deliveries, owner attestations, retention records or signed Proof-B evidence.
- The active app remains synthetic and disconnected. ACK Delivery Evidence stays Under Review and is not reclassified as HELD.

## Verification and release plan

- `npm run verify:ql293` runs QL-293 focused UI and pure-model tests plus QL-176/192/196 and the prior QL-292/291/290 operator regressions.
- `npm --prefix app run check`, `npm --prefix app run test`, `node scripts/__tests__/ql171-operator-baseline.test.mjs`, `npm --prefix app run build`.
- Exact tested Git tree through guarded feature → `dev` → `main` merges, five successful production checks on the exact code `main` SHA, and downloaded public Worker JS/CSS SHA-256 matching the local build before **Production GREEN**.

## Next queued build

**QL-294 — Assignment Worklists, Operator Handoff Summaries & Accessible Command Shortcuts.** Create coherent fictional task ownership, follow-up and handoff flows with keyboard discoverability, without changing real staff, provider systems or customer data.

See [the active QL-290–304 build queue](../QL-290-304-REQUIRED_BUILD_QUEUE.md). QL-294 becomes the next release only after QL-293 has a verified GREEN production receipt.
