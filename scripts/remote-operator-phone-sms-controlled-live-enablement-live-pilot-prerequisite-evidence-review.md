# Remote Operator Checklist — QL-052 Prerequisite Evidence Review

## Branch

`ql-052-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review`

## Required files

- `api/deployment/phoneSmsControlledLiveEnablementLivePilotPrerequisiteEvidenceReview.ts`
- `api/contracts/phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review.example.json`
- `docs/65_PHONE_SMS_CONTROLLED_LIVE_ENABLEMENT_LIVE_PILOT_PREREQUISITE_EVIDENCE_REVIEW.md`
- `docs/builds/QL-052-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review.md`
- `ops/telephony/phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review.md`
- `telephony/controlled-live-enablement-live-pilot-prerequisite-evidence-review.md`
- `scripts/remote-operator-phone-sms-controlled-live-enablement-live-pilot-prerequisite-evidence-review.md`
- `docs/08_BUILD_SEQUENCE.md`

## Safety confirmation

Before opening promotion:

- Confirm QL-052 is prerequisite evidence review only.
- Confirm the next stage is only a prerequisite gap-closure plan.
- Confirm provider callbacks, phone webhooks, SMS sending, recording, AI, persistence, live customer access, dry-run execution, provider delivery, archive writes, retention policy writes, provider account connection, provider live-number attachment, and live pilot runtime remain disabled.
- Confirm no Supabase migration was added.
- Confirm no provider account, live number, or callback route was enabled.

## Promotion sequence

1. Open PR from the QL-052 branch into `dev`.
2. Wait for CI on the exact QL-052 head.
3. Merge to `dev` only after install, check, and build pass.
4. Open promotion PR from `dev` to `main`.
5. Wait for CI on the exact `dev` head.
6. Merge to `main` only after promotion CI passes.
7. Confirm final `main` push CI passes on the exact merge commit.

## Next queued build

QL-053 — Phone/SMS Controlled Live Enablement Live-Pilot Prerequisite Gap Closure Plan.
