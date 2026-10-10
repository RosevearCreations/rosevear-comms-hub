# Remote Operator Note — QL-084

## Build

QL-084 — Public Disabled Preview Synthetic Conversation Selector Review

## Operator review

The public disabled preview now reviews the synthetic conversation selector introduced in QL-083.

The operator may safely:

- Open the Interface Preview panel.
- Switch between Rosie Dazzlers and Devil n Dove.
- Select hard-coded synthetic conversations.
- Review the synthetic summary, draft-only copy, and timeline.
- Confirm locked actions remain locked.

The operator must treat all content as sample-only. No customer message, provider inbox, Phone/SMS event, call recording, transcript, archive, retention record, or AI output is present.

## Runtime lock

Do not configure or enable provider accounts, callback URLs, SMS delivery, phone runtime, live customer records, Supabase runtime reads/writes, archive writes, retention writes, AI send, or live pilot runtime for this build.

## Next step

QL-085 may plan synthetic conversation detail tabs, but only within browser-local, hard-coded, public disabled preview constraints.
