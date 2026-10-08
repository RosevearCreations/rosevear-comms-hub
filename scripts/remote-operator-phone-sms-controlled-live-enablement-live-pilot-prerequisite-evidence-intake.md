# Remote Operator Checklist — QL-051 Live-Pilot Prerequisite Evidence Intake

## Branch

`ql-051-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake`

## Required files

- `api/deployment/phoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceIntake.ts`
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake.example.json`
- `docs/64_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_PREREQUISITE_EVIDENCE_INTAKE.md`
- `docs/builds/QL-051-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake.md`
- `ops/telephony/phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake.md`
- `telephony/controlled-live-enablement-live-pilot-prerequisite-evidence-intake.md`
- `scripts/remote-operator-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-intake.md`
- `docs/08_BUILD_SEQUENCE.md`

## Safety confirmation

Before opening promotion:

- Confirm QL-051 is prerequisite evidence intake only.
- Confirm the next stage is only prerequisite evidence review.
- Confirm provider callbacks, phone webhooks, SMS sending, recording, AI, persistence, live customer access, dry-run execution, provider delivery, archive writes, retention policy writes, provider account connection, provider live-number attachment, and live pilot runtime remain disabled.
- Confirm no Supabase migration was added.
- Confirm no provider account or callback route was enabled.

## Promotion sequence

1. Open PR from the QL-051 branch into `dev`.
2. Wait for CI on the exact QL-051 head.
3. Merge to `dev` only after install, check, and build pass.
4. Open promotion PR from `dev` to `main`.
5. Wait for CI on the exact `dev` head.
6. Merge to `main` only after promotion CI passes.
7. Confirm final `main` push CI passes on the exact merge commit.

## Next queued build

QL-052 — Phone/SMS Controlled Live Enablement Live-Pilot Prerequisite Evidence Review.
