# Phone/SMS Disabled Dry-Run Runtime Verification — Operator Checklist

Build: QL-028

## Before running verification

Confirm all items below are true:

- QL-027 disabled dry-run connection plan is complete.
- Provider webhook remains unconfigured.
- The actual purchased test number is not in the repository.
- Only alias labels are used for the disposable test number.
- Synthetic voice and SMS fixtures are used.
- Persistence writes are disabled.
- Live customer reads and writes are disabled.
- Phone webhooks, SMS sending, call recording, AI drafts, and AI auto-send are disabled.

## Expected runtime results

- Disabled mode returns `HTTP 503`.
- Disabled mode returns `accepted: false`.
- Voice dry-run fixture returns `accepted: true` and `persisted: false`.
- SMS dry-run fixture returns `accepted: true` and `persisted: false`.
- Non-synthetic payloads are rejected.
- Persistence dependency is not called.

## Do not do these in QL-028

- Do not paste the actual test number.
- Do not paste existing personal, Bell Fibe, RosieDazzlers, or DevilnDove numbers.
- Do not paste provider credentials, SIP credentials, tokens, passwords, or webhook secret values.
- Do not configure provider webhooks.
- Do not connect live callbacks.
- Do not enable SMS sending.
- Do not enable call recording.
- Do not enable AI drafts or AI auto-send.
- Do not use live customer data.
- Do not port or forward any existing number.

## Required safe result

QL-028 may prove disabled and dry-run runtime behavior with synthetic fixtures only. It must not become permission to connect a real provider webhook.
