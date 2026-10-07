# Controlled Live Enablement — Disabled Pilot Implementation Design

QL-040 is a provider-neutral design step for a future tiny monitored pilot implementation.

## What QL-040 allows

- Designing a disabled callback validation boundary.
- Designing disabled webhook and SMS surfaces.
- Designing manual operator handoff.
- Designing rate-limit, replay-protection, and idempotency guards.
- Designing redacted observability.
- Designing rollback, success criteria, abort criteria, and post-pilot review.

## What QL-040 forbids

- Connecting a provider account.
- Configuring provider webhooks.
- Enabling provider callbacks.
- Enabling live phone webhooks.
- Sending SMS.
- Recording calls.
- Enabling AI drafts or AI auto-send.
- Writing persistence records.
- Reading or writing live customer records.
- Committing phone numbers, provider secrets, webhook secrets, live payloads, recordings, transcripts, invoices, screenshots, customer records, or operator identities.

## Provider posture

Provider candidates remain labels only:

- VoIP.ms
- Telnyx
- Twilio

No provider-specific implementation is enabled in QL-040.

## Next step

QL-041 should design disabled runtime verification for the disabled pilot implementation surfaces.
