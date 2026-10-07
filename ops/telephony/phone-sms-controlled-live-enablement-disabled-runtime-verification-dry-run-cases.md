# QL-044 Ops Checklist — Disabled Runtime Verification Dry-Run Cases

## Pre-checks

- Confirm QL-043 is promoted and production green.
- Confirm dry-run cases are synthetic and redacted only.
- Confirm evidence remains `safeToPersist: false`.
- Confirm no provider account or webhook is configured.

## Case catalogue

Verify disabled cases exist for:

- Feature flag boundary.
- Provider callback.
- Phone webhook.
- SMS send.
- Call recording.
- AI draft.
- AI auto-send.
- Persistence write.
- Live customer access.
- Rate-limit guard.
- Replay-protection guard.
- Rollback kill switch.
- Redacted observability.
- Operator review.
- Post-run review.

## Stop conditions

Stop the build if any case:

- Uses real data.
- Allows provider delivery.
- Allows live behavior.
- Enables a runtime route.
- Marks evidence safe to persist.
- Attempts to execute the dry run in QL-044.

## Promotion rule

Promote only after feature PR CI and final `main` push CI pass.

## Next queued build

QL-045 — Phone/SMS Controlled Live Enablement Disabled Runtime Verification Dry-Run Result Review.
