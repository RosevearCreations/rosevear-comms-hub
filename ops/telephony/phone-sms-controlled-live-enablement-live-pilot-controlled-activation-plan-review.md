# QL-061 Ops Checklist — Controlled Activation Plan Review

## Gate

Do not enable live phone or SMS during this build.

## Required checks

- Confirm QL-059 explicit go/no-go approval exists for activation planning only.
- Confirm QL-060 controlled activation plan exists.
- Review variable handling plan without storing real secrets.
- Review service and application link plan.
- Review provider-account and live-number steps as future/manual steps only.
- Review callback registration as future/manual and disabled.
- Review rollback and kill-switch readiness.
- Review monitoring and alerting readiness.
- Review operator help and manual intervention guidance.
- Confirm disabled operator console scaffold is the next useful interface.

## Still disabled

- Provider account connection.
- Provider live-number attachment.
- Provider callback registration.
- Provider delivery.
- Live phone webhook runtime.
- SMS sending.
- Call recording.
- AI drafting or auto-send.
- Persistence writes.
- Live customer reads or writes.
- Archive writes.
- Retention policy writes.
- Live pilot runtime.

## Stop conditions

Stop and rework if any item requires real credentials, real phone numbers, provider payloads, customer records, callback registration, SMS sending, or live runtime execution.

## Promotion proof

Production is GREEN only when the exact final `main` push CI passes after the promotion PR is merged.
