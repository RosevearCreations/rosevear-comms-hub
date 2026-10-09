# QL-064 Ops Checklist — Disabled Operator Console Evidence Intake

## Goal

Collect synthetic/redacted evidence that the disabled operator console remains reachable, visible, reviewable, and fully disabled.

## Allowed evidence

- Screenshot or note that the admin console opens.
- Screenshot or note that the QL-064 stage is visible.
- Screenshot or note that runtime and provider delivery remain OFF.
- Names of required variables only.
- Guidance-only service/application link labels.
- Disabled action button states.
- Safety-lock confirmations.
- Synthetic/redacted operator notes.

## Not allowed

- Provider credentials.
- Secret values.
- Live phone numbers.
- Real customer data.
- Message bodies.
- Transcripts.
- Recording files.
- Callback tokens.
- Provider account connection.
- Runtime execution.

## Required disabled checks

Confirm all of these remain disabled:

- Provider account connection.
- Provider live-number attachment.
- Callback registration.
- SMS sending.
- Call customer.
- Persist evidence.
- Start live pilot.
- Call recording.
- AI draft and auto-send.
- Customer-data read/write.
- Archive/retention writes.

## Production proof

After `main` promotion, verify the production app still displays the disabled console and does not expose live action paths.

## Next build

QL-065 — evidence review only.
