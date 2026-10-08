# Remote Operator Checklist — QL-055 Gap Evidence Intake

## Branch

`ql-055-phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake`

## Review files

- `api/deployment/phoneSmsControlledLiveEnablementLivePilotPrerequisiteGapEvidenceIntake.ts`
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake.example.json`
- `docs/68_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_PREREQUISITE_GAP_EVIDENCE_INTAKE.md`
- `ops/telephony/phone-sms-controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake.md`
- `telephony/controlled-live-enablement-live-pilot-prerequisite-gap-evidence-intake.md`

## Confirm before merge

- QL-055 is intake-only.
- The only successful next decision is QL-056 gap evidence review.
- No provider account is connected.
- No provider live number is attached.
- Provider delivery is disabled.
- Live pilot runtime is disabled.
- SMS sending and call recording are disabled.
- AI draft and AI auto-send are disabled.
- Persistence, archive, and retention-policy writes are disabled.
- Evidence remains synthetic, redacted, and `safeToPersist: false`.
- No Supabase migration is included.

## CI requirement

- `npm install`
- `npm run check`
- `npm run build`

## Promotion rule

Do not call Production GREEN until the final `main` push CI passes on the exact main merge commit.
