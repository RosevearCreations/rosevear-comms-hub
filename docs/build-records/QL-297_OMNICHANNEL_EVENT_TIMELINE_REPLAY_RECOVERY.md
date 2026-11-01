# QL-297 — Omnichannel Event Timeline Simulator, Delivery Error States & Replay Recovery

## Implemented application scope

- New Operations workspace: **Omnichannel event timeline**.
- Four separate fictional company fixture sets (Rosie Dazzlers, Devil n Dove, Yard Workers and iCamp), each with six events covering phone, SMS, email-style, voicemail and missed-call channels.
- Source path, fixed simulated timestamp, delivery state, error code and operator recovery hint remain visible on each event card.
- Replay adds at most one original receipt per pinned event ID. Replaying a duplicate changes only operator feedback, never the event ledger.
- Two FAILED_MOCK cases per company support a single local RECOVERED_MOCK receipt, with distinct idempotency key and attempt number. Blocked or not-yet-replayed cases cannot recover.
- Source-linked timeline remains company-scoped, sorted deterministically and filterable by channel or failed/blocked state. Reset and company switch discard local receipt history.
- No real identifiers, provider integrations, email accounts, webhooks, callbacks, recordings, external messages, AI auto-send, database writes, localStorage or remote replay.

## Verification and release gate

`app/src/operator/__tests__/ql297Omnichannel.test.tsx` tests fixture provenance and coverage, idempotent replay, failure recovery, blocked cases and four-company isolation. Full app suite, TypeScript, security baseline and production build are required before promotion. GREEN requires the exact `main` commit's checks and live Worker JS/CSS hashes matching the tested bundle.

Six-app integrations remain DISCONNECTED / HOLD; ACK evidence workstream stays UNDER_REVIEW / PARKED_FOR_LATER.

**Next queued after verified GREEN:** QL-298 — Multi-Line Routing & IVR Scenario Studio with Safe Fallback Review.
