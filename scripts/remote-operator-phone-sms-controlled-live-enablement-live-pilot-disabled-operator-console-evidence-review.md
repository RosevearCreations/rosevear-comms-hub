# Remote Operator Checklist — QL-065 Disabled Operator Console Evidence Review

Use this checklist after the production build is green.

## Open the interface

1. Open the Rosevear Comms Hub admin application.
2. Open the floating **Phone/SMS console — disabled** button.
3. Confirm the console opens and says QL-065 evidence review.

## Confirm safe review evidence

Confirm the console shows:

- Evidence review only.
- Runtime OFF.
- Provider delivery OFF.
- Redacted evidence only.
- Variable names reviewed only.
- Rejected evidence examples.
- Disabled future action buttons.

## Confirm disabled actions

The following controls must remain disabled:

- Send SMS disabled.
- Call customer disabled.
- Connect provider disabled.
- Attach live number disabled.
- Persist evidence disabled.
- Start live pilot disabled.

## Stop immediately if

Stop and do not continue review if any of these appear:

- A provider credential field asking for real values.
- A live callback URL registration path.
- A live provider number attachment path.
- An enabled SMS send button.
- An enabled call button.
- An enabled evidence persistence button.
- An enabled live pilot button.
- Live customer names, phone numbers, message bodies, transcripts, or recordings.

## Do not capture

Do not capture or paste:

- Secret values.
- Live phone numbers.
- Customer data.
- Message bodies.
- Transcripts.
- Recordings.
- Callback tokens.
- Service-role keys.

## Expected QL-065 result

QL-065 can only approve QL-066 disabled evidence closure gate readiness. It does not approve live-pilot activation.
