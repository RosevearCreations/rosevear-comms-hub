# Remote Operator Checklist — QL-039 Tiny Monitored Pilot Plan

Use this checklist when promoting QL-039 remotely through GitHub.

## Branch

```text
ql-039-phone-sms-controlled-live-enablement-tiny-monitored-pilot-plan
```

## Required files

Confirm these files exist before opening the PR:

- `api/deployment/phoneSmsControlledLiveEnablementTinyMonitoredPilotPlan.ts`
- `api/contracts/phone-sms-controlled-live-enablement-tiny-monitored-pilot-plan.example.json`
- `docs/52_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_TINY_MONITORED_PILOT_PLAN.md`
- `docs/builds/QL-039-phone-sms-controlled-live-enablement-tiny-monitored-pilot-plan.md`
- `ops/telephony/phone-sms-controlled-live-enablement-tiny-monitored-pilot-plan.md`
- `telephony/controlled-live-enablement-tiny-monitored-pilot-plan.md`
- `scripts/remote-operator-phone-sms-controlled-live-enablement-tiny-monitored-pilot-plan.md`

## Safety checks

Do not promote if the diff includes:

- real phone numbers
- existing phone numbers
- provider credentials
- SIP credentials
- webhook secret values
- customer data
- live provider payloads
- call recordings
- transcripts
- invoices
- screenshots
- ownership documents
- real operator identities
- Supabase migrations
- enabled provider callbacks
- enabled phone webhooks
- enabled SMS sending
- enabled call recording
- enabled AI drafts
- enabled AI auto-send
- enabled persistence writes
- enabled live customer reads or writes

## PR to dev

Open the PR into `dev`.

Required CI:

```text
npm install
npm run check
npm run build
```

Only merge to `dev` after CI is green.

## Promotion to main

Open a promotion PR from `dev` to `main`.

Do not call production green until the final `main` push CI is green.

## Next build after QL-039

```text
QL-040 — Phone/SMS Controlled Live Enablement Disabled Pilot Implementation Design
```
