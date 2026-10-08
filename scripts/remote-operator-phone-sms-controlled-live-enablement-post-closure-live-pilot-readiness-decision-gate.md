# Remote Operator Checklist — QL-050 Post-Closure Readiness Decision Gate

## Branch

`ql-050-phone-sms-controlled-live-enablement-post-closure-live-pilot-readiness-decision-gate`

## Required files

- `api/deployment/phoneSmsControlledLiveEnablementPostClosureLivePilotReadinessDecisionGate.ts`
- `api/contracts/phone-sms-controlled-live-enablement-post-closure-live-pilot-readiness-decision-gate.example.json`
- `docs/63_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_POST_CLOSURE_LIVE_PILOT_READINESS_DECISION_GATE.md`
- `docs/builds/QL-050-phone-sms-controlled-live-enablement-post-closure-live-pilot-readiness-decision-gate.md`
- `ops/telephony/phone-sms-controlled-live-enablement-post-closure-live-pilot-readiness-decision-gate.md`
- `telephony/controlled-live-enablement-post-closure-live-pilot-readiness-decision-gate.md`
- `scripts/remote-operator-phone-sms-controlled-live-enablement-post-closure-live-pilot-readiness-decision-gate.md`
- `docs/08_BUILD_SEQUENCE.md`

## Safety confirmation

Before opening promotion:

- Confirm QL-050 is a readiness decision gate only.
- Confirm the next stage is only prerequisite evidence intake.
- Confirm provider callbacks, phone webhooks, SMS sending, recording, AI, persistence, live customer access, dry-run execution, provider delivery, archive writes, retention policy writes, and live pilot runtime remain disabled.
- Confirm no Supabase migration was added.
- Confirm no provider account or callback route was enabled.

## Promotion sequence

1. Open PR from the QL-050 branch into `dev`.
2. Wait for CI on the exact QL-050 head.
3. Merge to `dev` only after install, check, and build pass.
4. Open promotion PR from `dev` to `main`.
5. Wait for CI on the exact `dev` head.
6. Merge to `main` only after promotion CI passes.
7. Confirm final `main` push CI passes on the exact merge commit.

## Next queued build

QL-051 — Phone/SMS Controlled Live Enablement Live-Pilot Prerequisite Evidence Intake.
