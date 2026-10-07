# Remote Operator Checklist — QL-038 Manual Go/No-Go Gate

## Branch

```text
ql-038-phone-sms-controlled-live-enablement-manual-go-no-go-gate
```

## Files expected

```text
api/deployment/phoneSmsControlledLiveEnablementManualGoNoGoGate.ts
api/contracts/phone-sms-controlled-live-enablement-manual-go-no-go-gate.example.json
docs/51_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_MANUAL_GO_NO_GO_GATE.md
docs/builds/QL-038-phone-sms-controlled-live-enablement-manual-go-no-go-gate.md
ops/telephony/phone-sms-controlled-live-enablement-manual-go-no-go-gate.md
scripts/remote-operator-phone-sms-controlled-live-enablement-manual-go-no-go-gate.md
telephony/controlled-live-enablement-manual-go-no-go-gate.md
```

## Updated files expected

```text
.env.example
README.md
docs/08_BUILD_SEQUENCE.md
```

## Safety proof

The build must prove:

```text
QL-038 does not grant live enablement
approval permits only QL-039 planning
provider callbacks remain disabled
phone webhooks remain disabled
SMS sending remains disabled
call recording remains disabled
AI drafts remain disabled
AI auto-send remains disabled
persistence writes remain disabled
live customer reads remain disabled
live customer writes remain disabled
safeToPersist remains false
```

## Do not promote if

```text
any live flag is enabled
any provider callback is configured
any phone webhook is enabled
SMS sending is enabled
call recording is enabled
AI draft or auto-send is enabled
persistence writes are enabled
live customer reads or writes are enabled
actual phone numbers are present
provider credentials are present
webhook secret values are present
customer data is present
live payloads are present
recordings or transcripts are present
```

## Required CI

```text
npm install
npm run check
npm run build
```

## Promotion path

```text
feature branch → dev PR → dev GREEN → main PR → main GREEN
```
