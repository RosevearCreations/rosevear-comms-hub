# QL-176 — Conversation Timeline & Unsent Draft Workspace

**Release boundary:** Provenance-validated, pinned QL-173 synthetic fixtures only. No external communication, Supabase write/schema migration, private customer import, browser storage, real owner approval, provider callback, delivery receipt or message export was added.

## Delivered

1. `app/src/operator/ql176ConversationTimeline.ts` builds deterministic brand-isolated conversation timelines from QL-173 conversations and messages. Opening events, synthetic inbound examples and internal-only notes each retain the source channel, immutable ID, timestamp and fixture provenance. The entire canonical snapshot is revalidated before projection; corrupted sources fail closed.
2. The four existing pinned drafts remain **UNSENT / SIMULATED**. They appear in their respective timeline with an unsent marker and their QL-173 synthetic fixture ID. A thread without an existing draft may still be used for a local-only draft composition exercise.
3. **Mock delivery-failure examples** are displayed on the four fixture-draft threads as explicit **TRAINING EXAMPLE — no send attempted** entries. Their `FAILED_SIMULATED` state is a UI illustration only, not an actual provider event, failed customer delivery, webhook, receipt, sign-off or dispatch attempt. No delivered/sent/approved status is generated.
4. `Ql176ConversationTimelinePreview.tsx` adds an accessible brand-specific conversation list, channel-aware event history, kind filters, clearly labelled internal notes, and a mock-only draft text area. It sits under QL-174 triage and QL-175 contact/consent within the same QL-172 **Synthetic conversations** workspace.
5. Draft edits use React memory only. `redactQl176Draft` strips common email, phone, web URL, bearer token and secret-key patterns immediately, prior to state assignment; length is limited to 800 characters. The editor warns not to enter actual people/credentials and provides no send, export, copy, autosave, owner approval or persisted history action.
6. The only editor actions are **Stage unsent simulation** and **Discard local edit**. A staged draft is marked `UNSENT_SIMULATED` and adds a clearly local-only timeline marker; discard reverts to the unchanged canonical fixture. Selecting another brand discards staged text and resets the thread/filter. Wrong-brand IDs, unverified fixtures, unsafe operations and forged `SENT` overlay states are ignored.
7. Controls have labelled sections and status announcements, 44px interaction targets, keyboard focus indicators, mobile layout and forced-colour visibility.

## Acceptance test expectations

`app/src/operator/__tests__/ql176ConversationTimeline.test.tsx` covers:

- Exactly three synthetic threads per brand, provenance and channel preservation, no cross-brand identity leakage.
- Two inbound fixture messages and four internal-only notes; none are outbound.
- Four pinned `UNSENT_SIMULATED` drafts and four `FAILED_SIMULATED` illustrative failures; no claimed provider delivery or owner approval.
- Redaction and 800-character cap, including email, phone, URL, token and secret-key examples.
- In-memory stage/discard operations and rejection of forged grants/sends, cross-brand IDs, invalid operations, unverified fixtures and mutated provenance.
- Rendered operator interactions do not invoke `fetch` or `localStorage.setItem`; business switching discards local drafts.
- ARIA landmarks/status, keyboard focus, responsive layout and forced-colour CSS.

Run full regression and audit:

```text
cd app
npm run check
npm test
npm run build
npm run pages:build
cd ..
node scripts/ql171-operator-baseline.mjs
node --test scripts/__tests__/ql171-operator-baseline.test.mjs
```

## Release evidence and gate

Review feature PR → `dev`, then separately promote `dev` → `main`. Only mark **`main` Production = GREEN** when all five **exact main SHA** checks succeed (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`) and the published Pages URL responds successfully with this QL-176 bundle. This is a healthy **disabled-preview release**, never live telephony authorization.

**Next queued:** QL-177 — Brand-Specific Intake & Quote Handoff Preview. After QL-176 promotion, **6 builds (QL-177–182)** remain.
