# Phone/SMS Controlled Live Enablement Tiny Monitored Pilot Plan — Ops Checklist

Build: QL-039

## Operator posture

QL-039 is a planning-only build. It must not create, connect, or enable a live pilot.

## Required confirmations

Before QL-039 can be treated as green, confirm:

- QL-034 approved planning only.
- QL-035 controlled plan exists.
- QL-036 disabled implementation scaffold exists.
- QL-037 disabled verification passed.
- QL-038 manual go/no-go approved tiny monitored pilot planning only.
- Provider webhooks remain unconfigured.
- Provider callbacks remain disabled.
- Phone webhooks remain disabled.
- SMS sending remains disabled.
- Call recording remains disabled.
- AI drafts remain disabled.
- AI auto-send remains disabled.
- Persistence writes remain disabled.
- Live customer reads and writes remain disabled.
- No Supabase migration is added.
- No actual phone numbers, credentials, webhook secret values, customer data, recordings, transcripts, invoices, screenshots, or ownership documents are committed.

## Tiny monitored pilot plan controls

The plan must cover:

- scope
- operator coverage
- manual approval
- provider boundary
- callback boundary
- webhook boundary
- SMS boundary
- recording boundary
- AI boundary
- persistence boundary
- live customer boundary
- rate limits
- replay protection
- redaction
- observability
- rollback
- success and abort criteria
- later build requirement

## Stop conditions

Stop promotion if QL-039:

- enables live traffic
- configures provider webhooks
- stores a real phone number
- stores provider credentials
- stores webhook secret values
- enables SMS sending
- enables call recording
- enables AI drafts or auto-send
- enables persistence writes
- enables live customer access
- adds a Supabase migration
- stores live provider payloads
- stores customer data
- removes the QL-040 requirement

## Production proof

Production is green only after:

1. PR to `dev` passes CI.
2. PR from `dev` to `main` passes CI when available.
3. Final `main` push CI passes.

Required final CI steps:

```text
npm install
npm run check
npm run build
```
