# QL-040 Ops Checklist — Disabled Pilot Implementation Design

## Purpose

Use this checklist to verify QL-040 remains a disabled pilot implementation design only.

## Required checks

- QL-039 approved only a later disabled implementation design.
- No provider account is connected.
- No provider webhook is configured.
- No provider callback route is enabled.
- No live phone webhook is enabled.
- No SMS sending is enabled.
- No call recording is enabled.
- No AI drafts or AI auto-send are enabled.
- No persistence writes are enabled.
- No live customer reads or writes are enabled.
- No Supabase migration is included.
- No actual phone numbers or existing numbers are committed.
- No provider credentials, SIP credentials, webhook secret values, invoices, screenshots, ownership documents, live payloads, recordings, transcripts, customer data, or operator identities are committed.

## Required design surfaces

- Feature flag boundary.
- Provider callback validation.
- Disabled phone webhook stub.
- Disabled SMS send stub.
- Disabled recording stub.
- Disabled AI stub.
- Disabled persistence stub.
- Disabled live customer access stub.
- Manual operator handoff.
- Rate limit guard.
- Replay protection guard.
- Idempotency guard.
- Redacted observability.
- Rollback kill switch.
- Success criteria.
- Abort criteria.
- Post-pilot review gate.

## Promotion rule

Do not call production green unless the final `main` push CI for the exact QL-040 commit passes.
