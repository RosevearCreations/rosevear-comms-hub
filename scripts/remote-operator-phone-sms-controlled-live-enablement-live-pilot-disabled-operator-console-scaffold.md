# Remote Operator Checklist — QL-062 Disabled Operator Console Scaffold

## Scope

Promote QL-062 through `dev` and `main` with final production CI proof.

## Files expected

- `app/src/operator/DisabledOperatorConsole.tsx`
- `app/src/operator/disabled-operator-console.css`
- `app/src/main.tsx`
- `api/deployment/phoneSmsControlledLiveEnablementLivePilotDisabledOperatorConsoleScaffold.ts`
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold.example.json`
- `docs/75_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_DISABLED_OPERATOR_CONSOLE_SCAFFOLD.md`
- `docs/builds/QL-062-phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold.md`
- `ops/telephony/phone-sms-controlled-live-enablement-live-pilot-disabled-operator-console-scaffold.md`
- `telephony/controlled-live-enablement-live-pilot-disabled-operator-console-scaffold.md`

## Manual intervention

No manual provider input is required for QL-062.

Current access remains the deployed admin interface. After QL-062 is promoted, open the floating **Phone/SMS console — disabled** button in the lower-right corner.

## Promotion proof

- PR into `dev` must pass `npm install`, `npm run check`, and `npm run build`.
- Promotion PR into `main` must pass the same CI.
- Final `main` push CI must pass before declaring Production GREEN.

## Next queued build

QL-063 — Phone/SMS Controlled Live Enablement Live-Pilot Disabled Operator Console Review.
