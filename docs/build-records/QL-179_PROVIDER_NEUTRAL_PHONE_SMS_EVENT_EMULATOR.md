# QL-179 — Provider-Neutral Phone/SMS Event Emulator

Status: **release candidate**, pending exact-main PR promotion and GitHub Pages publication. See `docs/QL-171-182-REQUIRED_BUILD_QUEUE.md` for subsequent QL-180–182 scope.

## Delivered scope

- Add a **provider-neutral, checked-in mock event contract** in `app/src/operator/ql179MockPhoneSms.ts`: versioned envelope and event schema, stable synthetic idempotency keys, voice/SMS direction, inbound call, missed-call, voicemail, inbound SMS, outbound intent, mock status and error codes.
- Pin ten events to verified QL-173 canonical conversations (five per brand). No phone numbers, SMS bodies, provider IDs, actual voicemail audio, carrier endpoint or arbitrary external input is accepted.
- Validate exact envelope/event field allowlists, fixture version, screen-memory transport marker, brand and QL-173 source/provenance. An explicit **NO_REAL_SIGNATURE_OR_AUTHENTICATION** marker states that this is in-process shape validation, never real webhook signature verification.
- Support bounded, deterministic in-memory replay with at-most-one accepted receipt per idempotency key. Forged events, wrong-brand IDs, source drift, duplicate replay and invalid histories fail closed or are explicitly ignored.
- Mount a keyboard-usable brand-specific simulator under **Phone/SMS emulator** in the unified operator shell. Display mock voice/SMS event feed with QL-173 conversation subjects and QL-178 sample follow-up tasks, status and error examples, channel filters, repeat-event deduplication and reset. Changing brand discards the local feed.
- Preserve QL-178 operator task simulation, QL-177 intake, QL-176 unsent drafts, and QL-004 local preview unchanged. This build adds no provider SDK, routing, scheduling, database migration, server endpoint or live action.

## Hard authorization and security boundary

- Only checked-in `ql179-pinned-voice-sms-v1` data is eligible. This **cannot receive real webhooks**: no listener, HTTP route, callback URL, signature secret, backend function, credential or phone number is configured.
- `RECEIVED_MOCK`, `MISSED_MOCK`, `VOICEMAIL_MOCK`, `BLOCKED_MOCK` and `FAILED_MOCK` are illustrative statuses. **None** means a message was sent/delivered, a call originated, voicemail recorded, provider timeout actually occurred or human owner approved a workflow.
- Output is a React in-memory overlay, with no browser persistence, Supabase reads/writes, real customers, outbound dispatch, forwarding, IVR, call recording, SMS sending, provider callbacks, retention or consent mutation.
- Real provider webhook verification needs a separately approved backend trust boundary and live-pilot decision; this emulator does not establish or waive those prerequisites.

## Required verification and promotion gates

1. `npm run check`, `npm test`, `npm run build`, `npm run pages:build` under `app/`.
2. Root `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs` and `node scripts/__tests__/ql170-release-receipt.test.mjs` with no new unsafe provider network or Supabase mutations.
3. Promote only the reviewed QL-179 model, emulator, CSS, tests, shell integration, build record and queue status via feature → `dev` → `main`, verifying identical `dev`/`main` tree hashes. Preserve unrelated local worktree changes.
4. Confirm the *exact* main SHA has `success` for `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview` and `Workers Builds: rosevear-comms-hub`; then confirm GitHub Pages HTTP200 serves the QL-179 emulator bundle with `NO_REAL_SIGNATURE_OR_AUTHENTICATION`/no-dispatch content.

**After QL-179 is GREEN:** three builds QL-180–182 remain: multi-line routing/IVR simulation, privacy/roles/live-pilot prerequisite gate, synthetic operator journey acceptance and queue closure.
