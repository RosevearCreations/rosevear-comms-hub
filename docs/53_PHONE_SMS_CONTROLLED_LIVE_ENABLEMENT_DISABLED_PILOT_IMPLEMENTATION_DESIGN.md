# QL-040 — Phone/SMS Controlled Live Enablement Disabled Pilot Implementation Design

## Status

Design-only build. QL-040 does not start a live pilot and does not grant live enablement.

## Purpose

QL-040 turns the QL-039 tiny monitored pilot plan into a disabled-by-default implementation design. It defines the implementation surfaces that a later build must verify before any pilot runtime behavior can be considered.

## Required prior gates

- QL-034 explicit live enablement decision gate approved.
- QL-035 controlled live enablement plan ready.
- QL-036 disabled implementation scaffold ready.
- QL-037 disabled verification green.
- QL-038 manual go/no-go approved for pilot planning only.
- QL-039 tiny monitored pilot plan approved for disabled implementation design only.

## Required design surfaces

- Feature flag boundary.
- Provider callback validation.
- Phone webhook disabled stub.
- SMS send disabled stub.
- Recording disabled stub.
- AI disabled stub.
- Persistence disabled stub.
- Live customer access disabled stub.
- Manual operator handoff.
- Rate-limit guard.
- Replay-protection guard.
- Idempotency guard.
- Redacted observability.
- Rollback kill switch.
- Success criteria.
- Abort criteria.
- Post-pilot review gate.

## Always disabled in QL-040

```text
livePilotRuntimeAllowed: false
liveEnablementAllowed: false
providerWebhookConfigured: false
providerCallbackAllowed: false
phoneWebhookAllowed: false
smsSendAllowed: false
callRecordingAllowed: false
aiDraftAllowed: false
autoSendAllowed: false
persistenceWrites: false
liveCustomerRead: false
liveCustomerWrite: false
safeToPersist: false
```

## Evidence posture

QL-040 evidence remains synthetic and redacted only. Do not commit:

- actual phone numbers
- existing phone numbers
- provider credentials
- SIP credentials
- webhook secret values
- customer records
- live provider payloads
- call recordings
- transcripts
- invoices
- screenshots
- ownership documents
- real operator identities
- mapped live records
- journaled live records
- retained live records
- pilot evidence

## Production rule

Production is green only when the final `main` push CI for the exact QL-040 main commit passes install, check, and build.

## Next queued build

QL-041 — Phone/SMS Controlled Live Enablement Disabled Runtime Verification Design.
