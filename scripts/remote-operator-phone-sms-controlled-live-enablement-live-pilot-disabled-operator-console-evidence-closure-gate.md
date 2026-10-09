# QL-066 Remote Operator Checklist — Disabled Operator Console Evidence Closure Gate

Use after production deploy only.

## Open the interface

1. Open the Rosevear Comms Hub admin app or current app preview.
2. Open **Phone/SMS console — disabled**.
3. Confirm the console opens without provider login, provider callback setup, live number attachment, or runtime start.

## Confirm QL-066 labels

Confirm the console shows:

- QL-066 disabled operator console evidence closure gate;
- evidence closure only;
- runtime OFF;
- provider delivery OFF;
- closure Closed;
- redacted proof only.

## Confirm closure blocks

Confirm the UI rejects:

- provider credential values;
- live customer names;
- live phone numbers;
- message bodies;
- transcripts;
- recordings;
- callback tokens;
- enabled SMS/call/connect/live-pilot controls;
- persisted evidence artifacts;
- archive writes;
- retention policy writes.

## Confirm disabled buttons

Expected disabled buttons:

- Send SMS disabled;
- Call customer disabled;
- Connect provider disabled;
- Attach live number disabled;
- Persist closure disabled;
- Start live pilot disabled.

## Stop condition

Stop and do not continue if any button can send, call, connect, attach, persist, archive, change retention, or start live pilot runtime.
