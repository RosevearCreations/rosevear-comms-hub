# QL-063 Ops Checklist — Disabled Operator Console Review

## Goal

Review the QL-062 disabled operator console before collecting any console evidence in QL-064.

## Required checks

- Confirm the existing admin app remains the entry point.
- Confirm the floating **Phone/SMS console — disabled** button is visible in the lower-right corner.
- Confirm the console opens without navigating away from the admin app.
- Confirm all live action buttons are disabled.
- Confirm readiness status is descriptive and does not imply live enablement.
- Confirm safety locks list all blocked live/runtime capabilities.
- Confirm variables are named without secret values.
- Confirm service/application links are guidance-only.
- Confirm operator notes remain synthetic/redacted.
- Confirm no notes are persisted to backend storage.
- Confirm provider connection remains blocked.
- Confirm live-number attachment remains blocked.
- Confirm callback registration remains blocked.
- Confirm SMS sending remains blocked.
- Confirm call recording remains blocked.
- Confirm AI drafts and AI auto-send remain blocked.
- Confirm persistence writes and live customer access remain blocked.
- Confirm archive and retention writes remain blocked.
- Confirm production CI is green.

## Forbidden actions

Do not connect a provider, attach a live number, register callback URLs, send SMS, record calls, enable AI, write persistence, inspect live customer records, or start a live pilot during this review.

## Output

If all checks pass, approve only QL-064 disabled operator console evidence intake.
