# QL-063 Remote Operator Checklist — Disabled Operator Console Review

Use this checklist only after QL-063 reaches production.

## Access

1. Open the existing Rosevear Comms Hub admin web app.
2. Confirm the normal admin sections still load.
3. Click the floating **Phone/SMS console — disabled** button in the lower-right corner.
4. Confirm the console opens as an overlay.

## Review

- Readiness status is visible.
- Safety locks are visible.
- Manual activation checklist is visible.
- Variables are names only; no secret values are shown.
- Service/application links are guidance-only.
- Operator notes are synthetic/redacted.
- Send/connect/register/start buttons are disabled.

## Do not do

- Do not enter provider credentials.
- Do not enter real customer data.
- Do not enter real phone numbers.
- Do not register callback URLs.
- Do not send messages.
- Do not start live runtime.

## Expected result

The console is useful for readiness review only and stays fully disabled until later builds explicitly prove and enable a controlled path.
