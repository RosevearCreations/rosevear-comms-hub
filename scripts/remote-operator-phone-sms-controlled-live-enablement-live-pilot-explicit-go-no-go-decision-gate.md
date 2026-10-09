# Remote Operator Checklist — QL-059

Branch: `ql-059-phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate`

## Verify changed files

- `app/src/help/SiteHelpSystem.tsx`
- `app/src/help/site-help.css`
- `app/src/main.tsx`
- `api/deployment/phoneSmsControlledLiveEnablementLivePilotExplicitGoNoGoDecisionGate.ts`
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate.example.json`
- `docs/72_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_EXPLICIT_GO_NO_GO_DECISION_GATE.md`
- `docs/help/WEBSITE_SECTION_HELP_SYSTEM.md`
- `docs/builds/QL-059-phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate.md`
- `ops/telephony/phone-sms-controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate.md`
- `telephony/controlled-live-enablement-live-pilot-explicit-go-no-go-decision-gate.md`
- `docs/08_BUILD_SEQUENCE.md`

## Safety proof

- The help system is UI-only.
- QL-059 approves only QL-060 activation planning.
- No provider connection, delivery, SMS, recording, AI auto-send, persistence, archive, retention, or live runtime is enabled.
- Manual intervention guidance is included for variables, services, and application links.

## Promotion proof

Before merge to `dev`, PR CI must pass:

- `npm install`
- `npm run check`
- `npm run build`

Before declaring production GREEN, exact `main` push CI must also pass those steps.

## Stray branches note

Prior stray `noop` branches and QL-059 `noop9` through `noop15` plus the QL-059 `-check` branch are unrelated, point to unchanged `dev`, contain no QL-059 changes, and must not be merged.
