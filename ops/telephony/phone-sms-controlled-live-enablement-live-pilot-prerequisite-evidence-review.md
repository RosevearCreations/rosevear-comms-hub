# QL-052 Ops Checklist — Live-Pilot Prerequisite Evidence Review

## Operator rule

Do not enable live traffic during QL-052.

QL-052 is prerequisite evidence review only. It does not permit live provider delivery, phone callbacks, SMS sending, recording, AI, persistence, archive writes, retention policy writes, provider account connection, provider live-number attachment, or live customer access.

## Required checks

- Confirm QL-034 through QL-051 are complete.
- Confirm QL-051 prerequisite evidence intake is ready.
- Confirm every review item is present, reviewed, passed, review-only, synthetic, redacted, and not safe to persist as live evidence.
- Confirm no review item grants live enablement or starts runtime behavior.
- Confirm rollback remains available.
- Confirm QL-053 is only a prerequisite gap-closure plan.

## Must remain disabled

- Provider webhook configuration.
- Provider callbacks.
- Phone webhooks.
- SMS sending.
- Call recording.
- AI drafts.
- AI auto-send.
- Persistence writes.
- Live customer reads and writes.
- Dry-run execution.
- Provider delivery.
- Archive writes.
- Retention policy writes.
- Provider account connection.
- Provider live-number attachment.
- Live pilot runtime.

## Stop conditions

Stop promotion if any of the following are present:

- Live behavior is enabled.
- Provider delivery is enabled.
- Provider account connection is enabled.
- Provider live-number attachment is enabled.
- Archive or retention writes are enabled.
- Persistence writes are enabled.
- Evidence labels are not synthetic and redacted.
- A Supabase migration is added.
- A provider route or webhook is enabled.
- Any evidence review item is missing or failed.

## Production proof

Production GREEN requires final `main` push CI to pass install, check, and build on the exact merge commit.
