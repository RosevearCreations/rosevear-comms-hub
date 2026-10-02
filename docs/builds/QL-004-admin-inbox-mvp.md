# QL-004 — Admin Inbox MVP

## Status

Complete.

## Summary

QL-004 turns the local scaffold into a more usable admin inbox.

## Included

- Inbox status filter.
- Inbox tag filter.
- Inbox source/channel filter.
- Search by contact, subject, summary, status, source, priority, or tag.
- Conversation detail panel.
- Contact detail screen.
- Intake detail screen.
- Follow-up task dashboard.
- Per-conversation tasks.
- Task completion.
- Local JSON export.
- Local JSON import.
- Demo reset.
- Source-of-truth documentation.

## Safety

Still local-only.

No live phone, SMS, AI sending, call recording, number forwarding, or number porting.

Do not enter production customer data yet.

## Verification expectation

GitHub Actions should run the app check/build after push.

Local manual verification, if available later:

```bash
cd app
npm install
npm run check
npm run build
```

## Handoff to QL-005

Next build should decide the first shared backend path.

Recommended next build:

```text
QL-005 — Shared Backend Decision and Foundation
```

QL-005 should not connect real phone/SMS yet.
