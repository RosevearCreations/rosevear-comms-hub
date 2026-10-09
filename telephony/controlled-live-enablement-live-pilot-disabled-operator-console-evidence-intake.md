# QL-064 Telephony Note — Disabled Operator Console Evidence Intake

QL-064 is an evidence-intake build for the disabled phone/SMS operator console.

## What changed

- The disabled console now identifies the current stage as QL-064.
- Evidence intake cards define the safe evidence to collect.
- Non-secret variable names are visible for operator review.
- Guidance-only service/application link labels are visible.
- Persist evidence and start live pilot remain disabled actions.

## What did not change

QL-064 does not:

- Connect a provider account.
- Attach a live provider number.
- Register callbacks.
- Enable provider webhooks.
- Enable live phone webhooks.
- Send SMS.
- Deliver provider traffic.
- Record calls.
- Generate AI drafts.
- Auto-send AI messages.
- Read or write live customer data.
- Write persistence.
- Write archives.
- Change retention policy.
- Start live pilot runtime.

## Evidence rule

Evidence must be synthetic, redacted, review-only, and unsafe to persist.
