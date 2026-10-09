# Remote Operator Checklist — QL-060 Controlled Activation Planning

Branch:

`ql-060-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning`

## Expected changed files

- `api/deployment/phoneSmsControlledLiveEnablementLivePilotControlledActivationPlanning.ts`
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning.example.json`
- `docs/73_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_CONTROLLED_ACTIVATION_PLANNING.md`
- `docs/builds/QL-060-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning.md`
- `ops/telephony/phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning.md`
- `telephony/controlled-live-enablement-live-pilot-controlled-activation-planning.md`
- `scripts/remote-operator-phone-sms-controlled-live-enablement-live-pilot-controlled-activation-planning.md`
- `docs/08_BUILD_SEQUENCE.md`

## Safety assertions

- QL-060 is planning-only.
- QL-060 does not connect a provider.
- QL-060 does not attach a live number.
- QL-060 does not register callbacks.
- QL-060 does not send SMS.
- QL-060 does not enable live pilot runtime.
- QL-060 does not write persistence or customer data.
- Evidence remains synthetic, redacted, and non-persistable.

## Manual intervention notes

Document variables, service links, application links, rollback, kill switch, monitoring, and operator review requirements. Do not enter secrets, credentials, phone numbers, ownership documents, provider payloads, customer data, screenshots, recordings, transcripts, or invoices.

## Promotion

1. Open PR to `dev`.
2. Wait for exact-head CI success.
3. Merge to `dev`.
4. Open promotion PR from `dev` to `main`.
5. Wait for exact-`dev` CI success.
6. Merge to `main`.
7. Wait for exact-`main` push CI success.
8. Declare `main` Production = GREEN only after CI success.
