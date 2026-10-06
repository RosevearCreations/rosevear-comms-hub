# Remote Operator Checklist — QL-034 Phone/SMS Explicit Live Enablement Decision Gate

Use this checklist before promoting QL-034.

## Branch and PR

- [ ] Branch starts from current `dev` production-equivalent tree.
- [ ] PR targets `dev` first.
- [ ] Promotion PR targets `main` only after the `dev` PR CI is green and merged.

## Required files

- [ ] `api/deployment/phoneSmsExplicitLiveEnablementDecisionGate.ts`
- [ ] `api/contracts/phone-sms-explicit-live-enablement-decision-gate.example.json`
- [ ] `docs/47_PHONE_SMS_EXPLICIT_LIVE_ENABLEMENT_DECISION_GATE.md`
- [ ] `docs/builds/QL-034-phone-sms-explicit-live-enablement-decision-gate.md`
- [ ] `ops/telephony/phone-sms-explicit-live-enablement-decision-gate.md`
- [ ] `telephony/explicit-live-enablement-decision-gate.md`

## Safety proof

Confirm the implementation keeps:

```text
liveEnablementAllowed: false
implementationBuildRequiredBeforeLiveTraffic: true
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

## Do not promote if

- provider account connection is added;
- provider webhook configuration is added;
- phone webhook route is enabled;
- SMS sending is enabled;
- call recording is enabled;
- AI drafts or AI auto-send are enabled;
- persistence writes are enabled;
- live customer access is enabled;
- actual phone numbers are present;
- provider credentials or webhook secret values are present;
- customer data or live provider payloads are present;
- recordings or transcripts are present;
- Supabase migration is added.

## CI gates

- [ ] Feature PR CI passed: `npm install`, `npm run check`, `npm run build`.
- [ ] `dev` merge completed.
- [ ] Production PR CI passed.
- [ ] `main` merge completed.
- [ ] Final `main` push CI passed.
