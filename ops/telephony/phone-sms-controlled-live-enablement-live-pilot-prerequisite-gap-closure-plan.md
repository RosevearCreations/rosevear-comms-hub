# QL-053 Ops Checklist — Live-Pilot Prerequisite Gap Closure Plan

## Before promotion

- Confirm QL-052 is complete and GREEN on `main`.
- Confirm the QL-053 helper and fixture are synthetic/redacted only.
- Confirm `safeToPersist: false` remains present for all plan evidence.
- Confirm there is no provider account connection.
- Confirm there is no provider live-number attachment.
- Confirm there is no provider callback route or webhook configuration.
- Confirm there is no SMS sending, call recording, AI, persistence write, archive write, retention write, or live customer access.

## Required gap-closure plan coverage

- Owner/manual approval gap closure.
- Provider setup prerequisite gap closure.
- Provider disabled-mode boundary gap closure.
- Phone-number ownership gap closure.
- SMS consent policy gap closure.
- STOP/START/HELP policy gap closure.
- Call-recording notice policy gap closure.
- Staff access control gap closure.
- Rollback and kill-switch gap closure.
- Rate-limit and replay-control gap closure.
- Audit and redaction gap closure.
- Customer-data boundary gap closure.
- Provider callback disabled proof gap closure.
- Live phone webhook disabled proof gap closure.
- SMS sending disabled proof gap closure.
- Recording disabled proof gap closure.
- AI features disabled proof gap closure.
- Persistence write disabled proof gap closure.
- Live pilot runtime disabled proof gap closure.
- Production proof gap closure.

## Stop conditions

Stop the promotion if any QL-053 artifact:

- enables live pilot runtime,
- connects a provider,
- attaches a live number,
- configures a provider callback or webhook,
- enables provider delivery,
- enables SMS sending,
- enables call recording,
- enables AI draft or auto-send,
- writes persistence, archive, or retention policy,
- reads or writes live customer data,
- contains non-redacted live evidence,
- marks plan evidence as safe to persist.

## Promotion proof

Promote only after feature PR CI and final `main` push CI pass `npm install`, `npm run check`, and `npm run build`.

## Next build

QL-054 — Phone/SMS Controlled Live Enablement Live-Pilot Prerequisite Gap Closure Review.
