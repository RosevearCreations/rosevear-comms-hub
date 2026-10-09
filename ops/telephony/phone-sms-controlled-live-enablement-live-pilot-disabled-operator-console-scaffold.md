# QL-062 Ops Checklist — Disabled Operator Console Scaffold

## Operator access

1. Open the existing Rosevear Comms Hub admin interface deployed from `main`.
2. Use the floating **Phone/SMS console — disabled** button in the lower-right corner.
3. Review the stage, safety locks, readiness checklist, and disabled future actions.

## Required safety checks

- Confirm provider connection is disabled.
- Confirm live-number attachment is disabled.
- Confirm provider callbacks and webhooks are disabled.
- Confirm phone webhook runtime is disabled.
- Confirm SMS sending is disabled.
- Confirm call recording is disabled.
- Confirm AI drafting and auto-send are disabled.
- Confirm persistence writes are disabled.
- Confirm live customer reads and writes are disabled.
- Confirm archive and retention writes are disabled.
- Confirm live pilot runtime is disabled.

## Stop conditions

Stop immediately if the console exposes any enabled action for:

- Sending SMS.
- Calling a customer.
- Connecting a provider.
- Attaching a live number.
- Registering a callback.
- Reading or writing live customer data.
- Writing persistence, archive, or retention records.

## Production proof

QL-062 is complete only after PR promotion to `main` and final `main` push CI is GREEN.
