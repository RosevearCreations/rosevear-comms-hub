# Remote Operator Checklist — QL-035 Phone/SMS Controlled Live Enablement Plan

Use this checklist when promoting QL-035 through GitHub only.

## Branch

```text
ql-035-phone-sms-controlled-live-enablement-plan
```

## Confirm changed files

Expected changed files:

```text
.env.example
README.md
api/contracts/phone-sms-controlled-live-enablement-plan.example.json
api/deployment/phoneSmsControlledLiveEnablementPlan.ts
docs/08_BUILD_SEQUENCE.md
docs/48_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_PLAN.md
docs/builds/QL-035-phone-sms-controlled-live-enablement-plan.md
ops/telephony/phone-sms-controlled-live-enablement-plan.md
scripts/remote-operator-phone-sms-controlled-live-enablement-plan.md
telephony/controlled-live-enablement-plan.md
```

## Verify safety

Before opening the PR, confirm:

- no actual phone number was added;
- no provider credential was added;
- no webhook secret value was added;
- no customer data was added;
- no recording or transcript was added;
- no screenshot, invoice, or ownership document was added;
- no Supabase migration was added;
- no provider callback route was enabled.

## PR to dev

Open PR into `dev`.

Required CI:

```text
npm install
npm run check
npm run build
```

Merge only after the exact branch head CI is green.

## Promotion to main

Open PR from `dev` to `main` after QL-035 merges into `dev`.

Merge only after promotion PR CI is green.

## Final production proof

After merging to `main`, verify the final `main` push CI is green on the exact merge commit.

Production is not green until the final `main` push CI succeeds.
