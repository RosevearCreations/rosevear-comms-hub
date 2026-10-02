# App

QL-003 provides the first interactive admin shell for Rosevear Comms Hub.

## Framework

- Vite
- React
- TypeScript

## Local run

```bash
npm install
npm run dev
```

## Checks

```bash
npm run check
npm run build
```

## Current data mode

The app uses browser `localStorage` through `src/storage/localRepository.ts`.

This is intentional. It allows us to test the contact, conversation, message, intake, and follow-up workflow before setting up Supabase, a VPS, phone/SMS provider, or shared authentication.

## What works in QL-003

- Switch between RosieDazzlers and DevilnDove.
- Create a manual lead.
- Automatically create contact + conversation + first message + intake request + follow-up task.
- Change conversation status.
- Add internal notes.
- Create and complete follow-up tasks.
- Reset local demo data.

## What is not live yet

- No production database.
- No auth.
- No phone/SMS provider.
- No AI provider.
- No call recording.
- No external integrations.
