# QL-050 Ops Checklist — Post-Closure Live-Pilot Readiness Decision Gate

## Operator rule

Do not enable live traffic during QL-050.

QL-050 is a readiness decision gate only. It permits only later prerequisite evidence intake and does not permit live provider delivery, phone callbacks, SMS sending, recording, AI, persistence, archive writes, retention policy writes, or live customer access.

## Required checks

- Confirm QL-034 through QL-049 are complete.
- Confirm QL-049 final disabled closure gate is complete.
- Confirm readiness items are present and reviewed.
- Confirm every item is decision-gate-only, passed, synthetic, redacted, and not safe to persist as live evidence.
- Confirm owner/manual approval remains required before any later stage.
- Confirm QL-051 is only prerequisite evidence intake.

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
- Any readiness item is missing or failed.

## Production proof

Production GREEN requires final `main` push CI to pass install, check, and build on the exact merge commit.
