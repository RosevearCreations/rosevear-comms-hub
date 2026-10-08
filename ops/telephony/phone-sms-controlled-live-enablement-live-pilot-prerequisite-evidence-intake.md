# QL-051 Ops Checklist — Live-Pilot Prerequisite Evidence Intake

## Operator rule

Do not enable live traffic during QL-051.

QL-051 is prerequisite evidence intake only. It does not permit live provider delivery, phone callbacks, SMS sending, recording, AI, persistence, archive writes, retention policy writes, provider account connection, provider live-number attachment, or live customer access.

## Required checks

- Confirm QL-034 through QL-050 are complete.
- Confirm all prerequisite evidence intake items are present.
- Confirm every item is collected, ready for review, intake-only, synthetic, redacted, and not safe to persist as live evidence.
- Confirm no provider account is connected.
- Confirm no provider live number is attached.
- Confirm QL-052 is only a prerequisite evidence review.

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
- Provider live number attachment.
- Live pilot runtime.

## Stop conditions

Stop promotion if any of the following are present:

- Live behavior is enabled.
- Provider delivery is enabled.
- Provider account connection is enabled.
- Archive or retention writes are enabled.
- Persistence writes are enabled.
- Evidence labels are not synthetic and redacted.
- A Supabase migration is added.
- A provider route or webhook is enabled.
- Any evidence intake item is missing or not ready for review.

## Production proof

Production GREEN requires final `main` push CI to pass install, check, and build on the exact merge commit.
