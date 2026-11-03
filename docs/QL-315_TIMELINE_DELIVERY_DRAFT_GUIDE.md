# QL-315 — Conversation Timeline, Delivery-State Visual Language & Unsent Draft Recovery

## Owner/operator walkthrough

This release improves two existing, **disabled synthetic preview** views. It does not add a delivery provider, a message sender, a live mailbox, a customer database or browser storage.

1. Open **Operator → Omnichannel event timeline**. Choose a checked-in fictional event and select **Replay mock event**. The local receipt appears in chronological source order with a step number, channel, source fixture identifier, error code and attempt number. The label **Received in preview** means the simulator accepted a fixture, **not that a customer received anything**.
2. Choose a `FAILED_MOCK` fixture and replay it once. **Rehearse failed-event recovery** creates a second in-memory receipt labelled **Local recovery rehearsed**. Replaying or recovering the same event again adds nothing. A `BLOCKED_MOCK` fixture cannot be recovered; it requires operator review. Use the channel filter and **Clear local timeline** to inspect/reset.
3. Open **Operator → Unified inbox**, select a fictional conversation and inspect the numbered timeline. Its labels distinguish inbound fixtures, internal notes, call simulations and UNSENT examples. Source event IDs and per-item contextual explanations are displayed. The timeline describes illustrative fixture order, **not real-world timestamps**.
4. Open **Operator → SMS/MMS composer**. The recovery banner identifies the selected fictional business, thread and current recovery state. Only a safe, redacted, same-company/same-thread `UNSENT_SIMULATED` draft is recoverable. When stale, invalid or foreign draft state is detected, it is hidden with a recovery-blocked warning. **Clear draft** discards only the current fictional thread's entry. A preview is local only: no SMS/MMS send, scheduling, upload or approval.
5. Open the **ⓘ Help** controls in the replay and composer views for recovery and consent guidance. Read the disabled-delivery/consent gate before any hypothetical response.

## State legend

| Fixture code | Screen label | What it really means |
| --- | --- | --- |
| `RECEIVED_MOCK` | Received in preview | Local acceptance of a checked-in fixture, not a verified delivery |
| `FAILED_MOCK` | Failed mock delivery | Synthetic error code; no transport request |
| `BLOCKED_MOCK` | Blocked for review | Review required; no auto-recovery or callback |
| `RECOVERED_MOCK` | Local recovery rehearsed | One additional local receipt; no provider retry |
| `UNSENT_SIMULATED` | UNSENT · Local draft available | Redacted, same-company/thread session-memory draft only |

The state text is always visible independently of colour. Narrow screens stack details and badges. Accessibility code review and automated DOM/fixture tests cover labelled controls, chronological list semantics, source text, forced-colour styles and reduced-motion. **Manual screen-reader chronological reading and real-device screenshot acceptance remain pending owner observation**, and are not claimed by automated tests.

## Release and external-connection boundary

- No telephony, SMS/MMS, email, provider retry, callback, upload, browser persistence, Supabase mutation or live customer contact.
- Six external source-app proof handoffs stay `DISCONNECTED / HOLD`. ACK Delivery Evidence stays `UNDER_REVIEW / PARKED_FOR_LATER`.
- Cloudflare/GitHub software **Production GREEN** means a deployed disabled-preview code build. It does **not** mean provider connection, verified source proof, operational delivery or owner/management sign-off.
- Capture widths, evidence and independent sign-off criteria are listed in `docs/visual/ql315-timeline-capture-matrix.json`.
