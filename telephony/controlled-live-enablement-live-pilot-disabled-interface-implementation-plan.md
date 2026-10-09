# Telephony Note — QL-069 Disabled Interface Implementation Plan

QL-069 adds a visible static interface preview only.

## Telephony state

No telephony provider is connected.

No provider callback is registered.

No live number is attached.

No SMS is sent.

No call runtime is enabled.

No recording, transcript, AI draft, AI auto-send, persistence write, live customer read/write, archive write, retention policy write, or live pilot runtime is enabled.

## Interface purpose

The preview exists so the operator can confirm that Quo-lite is moving toward the correct dashboard shape before any live path is introduced.

It is safe to review because it uses static copy and disabled controls only.

## Later boundary

Later work may prepare GitHub Pages as a static UI host and Supabase Edge Functions as the server-only boundary for provider secrets, callbacks, and service-role work.

QL-069 does not deploy or enable those paths.
