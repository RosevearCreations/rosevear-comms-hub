# QL-049 Ops Checklist — Final Disabled Closure Gate

## Operator rule

Do not enable live traffic during QL-049.

QL-049 is a final disabled closure gate only. It does not permit live provider delivery, phone callbacks, SMS sending, recording, AI, persistence, archive writes, retention policy writes, or live customer access.

## Required checks

- Confirm QL-034 through QL-048 are complete.
- Confirm final disabled closure gate items are present.
- Confirm every item is closed, passed, disabled-only, synthetic, redacted, and not safe to persist as live evidence.
- Confirm rollback remains available.
- Confirm manual owner review remains required before any later stage.
- Confirm QL-050 is only a readiness decision gate.

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
- Live pilot runtime.

## Stop conditions

Stop promotion if any of the following are present:

- Live behavior is enabled.
- Provider delivery is enabled.
- Archive or retention writes are enabled.
- Persistence writes are enabled.
- Evidence labels are not synthetic and redacted.
- A Supabase migration is added.
- A provider route or webhook is enabled.
- Any final closure item is missing or failed.

## Production proof

Production GREEN requires final `main` push CI to pass install, check, and build on the exact merge commit.
