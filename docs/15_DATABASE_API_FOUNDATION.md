# 15 — Database and API Foundation

## Build

QL-003 — Database and API Foundation.

## Decision

Use a **local repository pattern backed by browser localStorage** before connecting a hosted database.

## Why this choice

The workflow still needs to be proven before we add external systems. Local persistence lets us test customer records, conversations, messages, intakes, tasks, and status changes without risking Bell Fibe, cell numbers, SMS, call recording, or customer data in a hosted system.

## What QL-003 includes

- Shared TypeScript domain model.
- Local seed database.
- Local repository in `app/src/storage/localRepository.ts`.
- API facade in `app/src/api/hubApi.ts`.
- Interactive lead creation.
- Automatic contact + conversation + first message + intake request + follow-up task creation.
- Conversation status changes.
- Internal notes.
- Follow-up task creation/completion.
- Reset local demo data action.
- Expanded OpenAPI placeholder contract.
- Draft SQL indexes for the future hosted database.

## Current data boundary

QL-003 data is stored only in the browser using `localStorage`.

This means:

- data is not shared across computers or browsers;
- data can be reset locally;
- no production customers should be entered yet;
- no customer phone recordings, texts, or private photos should be stored yet.

## Future backend path

When the workflow is useful locally, QL-005 should decide the hosted backend path. The most likely option is Supabase/Postgres because it already matches the SQL-first design and can later support auth, row-level security, storage, and server-side APIs.

## Provider setup not needed yet

No external setup is required for QL-003.

Setup becomes necessary when we need one of these:

- shared data across devices;
- user authentication;
- customer photo/attachment storage;
- live RosieDazzlers or DevilnDove form submission;
- a test phone number;
- SMS inbox;
- voicemail/call transcription;
- AI summaries and draft replies.

## Safety rules preserved

- AI is draft-only later.
- No message auto-send.
- No live phone/SMS integration.
- No number porting.
- No Bell Fibe forwarding.
- No call recording.
- Brand separation stays in every record that needs it.
