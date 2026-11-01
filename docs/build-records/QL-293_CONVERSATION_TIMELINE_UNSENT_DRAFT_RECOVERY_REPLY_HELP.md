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

## Verified release receipt — Production GREEN

- **Local verification:** `npm run verify:ql293` passed 358 focused results (220 QL-289, 16 QL-290, 33 QL-291, 51 QL-292, 38 QL-293/176/192/196). `npm --prefix app run test` passed 1,078 application tests in 110 files; TypeScript check passed; the QL-171 security baseline passed 10 checks; and Vite production build passed (489 modules).
- **Exact tested source tree:** `70e924dc64d909a6765c9d1071fa519cfe5cac53`, unchanged in feature, `dev` and `main` merge commits.
- **Feature → `dev`:** [PR #554](https://github.com/RosevearCreations/rosevear-comms-hub/pull/554), exact `dev` merge commit `e2f941742756f6a2e21252bad38b1de9474e1d3a`, with app-build and Workers checks successful.
- **`dev` → `main`:** [PR #555](https://github.com/RosevearCreations/rosevear-comms-hub/pull/555), exact production code commit `bcf380802f6ded7d7f4bc8b9edb2ed973e3fbcb2`.
- **Exact-main production checks:** all five successful: `app-build`, `Workers Builds: rosevear-comms-hub`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`.
- **Live Worker:** `https://rosevear-comms-hub.devilndovelive.workers.dev/` served `assets/index-EXzhHpOa.js` with SHA-256 `2f25478430ee406263ada645e4c78ca00d0ebdc89b8b4abaabac9666a7fcaec6` and `assets/index-ClLX03ET.css` with SHA-256 `529a8a71ecda1909ce9d7775f75a0bb40495b622294dbafaed6154b9396c62c1`, byte-identical to the locally tested production bundle.
- **Queue state:** QL-293 is the fourth of 15 active builds verified Production GREEN. **4/15 GREEN, 11 remaining, QL-294 next.** No real owner receipt, original Proof-B, external ACK, live provider or authenticated source permission has been newly verified.

## Next queued build

**QL-294 — Assignment Worklists, Operator Handoff Summaries & Accessible Command Shortcuts.** Create coherent fictional task ownership, follow-up and handoff flows with keyboard discoverability, without changing real staff, provider systems or customer data.

See [the active QL-290–304 build queue](../QL-290-304-REQUIRED_BUILD_QUEUE.md). QL-294 is now next because QL-293 has a verified GREEN production receipt.
