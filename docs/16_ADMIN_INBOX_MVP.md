# 16 — Admin Inbox MVP

## Build

QL-004 — Admin Inbox MVP.

## Goal

Turn the QL-003 local data foundation into a more useful operator workspace.

## What QL-004 adds

- Inbox search.
- Status filter.
- Tag filter.
- Source/channel filter.
- Conversation detail panel.
- Contact detail view.
- Intake detail view.
- Follow-up task dashboard.
- Per-conversation task display.
- Task completion action.
- Internal notes remain available.
- Local JSON export.
- Local JSON import.
- Demo data reset remains available.
- Source-of-truth documentation for the inbox workflow.

## Why this build matters

The system needs to prove the daily operating pattern before we connect real systems.

The important workflow is:

```text
Open brand workspace
  ↓
Filter conversations needing action
  ↓
Review contact + intake details
  ↓
Add internal note or task
  ↓
Move status forward
  ↓
Complete follow-up
```

If this workflow feels right with local data, then QL-005 can safely move toward a shared backend.

## Data boundary

QL-004 still stores data only in browser `localStorage`.

Use only fake/test customer data.

Do not store:

- real customer phone numbers;
- private customer photos;
- real call recordings;
- real voicemail transcripts;
- production SMS;
- private health/personal notes;
- payment information.

## Remote verification

The operator does not need local Bash for QL-004.

GitHub Actions should run the app check/build remotely after push. If Actions is not enabled or not visible, the repo still contains the scripts needed for later verification.

## External setup required

None.

QL-004 does not require:

- Supabase;
- Vercel;
- Cloudflare;
- Bell Fibe;
- 3CX;
- FreePBX/Asterisk;
- Twilio;
- Telnyx;
- VoIP.ms;
- AI provider keys.

## QL-005 handoff

QL-005 should decide and implement the first shared backend path.

Likely direction:

- Supabase/Postgres for hosted shared data;
- owner/admin-only access first;
- preserve brand separation;
- keep phone/SMS provider-neutral;
- keep AI draft-only.

QL-005 should not port or forward real numbers yet.
