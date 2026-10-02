# QL-003 — Database and API Foundation

## Status

Complete.

## Summary

QL-003 adds the first working local data layer to the admin shell.

The app now supports a safe local-only workflow where we can create and manage sample contacts, conversations, messages, intake requests, and follow-up tasks for both RosieDazzlers and DevilnDove.

## Files added or changed

- `app/src/types.ts`
- `app/src/data/seedData.ts`
- `app/src/storage/localRepository.ts`
- `app/src/api/hubApi.ts`
- `app/src/App.tsx`
- `app/src/styles.css`
- `api/contracts/openapi.placeholder.yaml`
- `database/migrations/0002_indexes_and_constraints.sql`
- `docs/15_DATABASE_API_FOUNDATION.md`
- `docs/adr/ADR-0005-local-repository-before-hosted-database.md`
- `docs/builds/QL-003-database-api-foundation.md`

## Green criteria

- Brand switcher still works.
- Local repository loads seed data.
- Admin can create a manual lead.
- Manual lead creates contact, conversation, inbound message, intake request, and follow-up task.
- Admin can update conversation status.
- Admin can add an internal note.
- Admin can create/complete follow-up tasks.
- Admin can reset demo data.
- No external database, phone, SMS, or AI service is connected.

## Verification

Run locally:

```bash
cd app
npm install
npm run check
npm run build
```

## Handoff to QL-004

QL-004 should improve the admin inbox experience with filtering, search, contact detail, intake detail, task dashboard, and local export/import.
