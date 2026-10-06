# Remote Operator Checklist — QL-036 Phone/SMS Controlled Live Enablement Implementation Scaffold

Use this checklist when promoting QL-036 through GitHub only.

## Branch

```text
ql-036-phone-sms-controlled-live-enablement-implementation-scaffold
```

## Required file set

```text
api/deployment/phoneSmsControlledLiveEnablementImplementationScaffold.ts
api/contracts/phone-sms-controlled-live-enablement-implementation-scaffold.example.json
docs/49_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_IMPLEMENTATION_SCAFFOLD.md
docs/builds/QL-036-phone-sms-controlled-live-enablement-implementation-scaffold.md
ops/telephony/phone-sms-controlled-live-enablement-implementation-scaffold.md
scripts/remote-operator-phone-sms-controlled-live-enablement-implementation-scaffold.md
telephony/controlled-live-enablement-implementation-scaffold.md
.env.example
README.md
docs/08_BUILD_SEQUENCE.md
```

## PR to dev

1. Compare branch to `dev`.
2. Confirm intended QL-036 files only.
3. Open PR to `dev`.
4. Wait for App scaffold CI.
5. Require green:

```text
npm install
npm run check
npm run build
```

6. Merge to `dev` only after CI is green.

## Promotion to main

1. Open PR from exact `dev` head to `main`.
2. Wait for promotion PR CI if available.
3. Merge only after CI is green.
4. Wait for final `main` push CI.
5. Declare production green only after final `main` run has install, check, and build green.

## Safety checks

Do not promote if the diff includes:

- provider credentials;
- webhook secret values;
- actual phone numbers;
- screenshots;
- invoices;
- ownership documents;
- customer data;
- live provider payloads;
- call recordings;
- transcripts;
- Supabase migration enabling phone/SMS live writes;
- any live callback or SMS send enablement.
