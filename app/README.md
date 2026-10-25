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

QL-191 now adds a **four-organization, dashboard-first operator shell** for Rosie Dazzlers, Devil n Dove, iCamp and YW. iCamp/YW have company-isolated synthetic previews only; the original two-brand browser-local demo remains intact. All dashboard counts are fabricated and labelled as such. No new backend, provider, real customer-data or owner-approval capability is introduced. See [`docs/QL-191_OPERATOR_CONSOLE_V2_FOUR_ORGANIZATION_DASHBOARD.md`](../docs/QL-191_OPERATOR_CONSOLE_V2_FOUR_ORGANIZATION_DASHBOARD.md).

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

## QL-170 production receipt re-verification

QL-170 introduced an independent release-receipt verifier and an explicit queue-reconciliation gate. See `../scripts/ql170-release-receipt.mjs` and `../docs/build-records/QL-170_RELEASE_RECEIPT_INTEGRITY_QUEUE_RECONCILIATION.md` for the original build evidence and disabled-preview boundaries.

This documentation-only app-area update re-triggers the GitHub Pages disabled-preview workflow, which otherwise skips a change confined to `docs/`. It changes **no React, database, provider, authentication, callback, routing, or Worker runtime code**. Both brands remain a synthetic/local demonstration; actual customer data and private owner approvals are not authorized. Phone/SMS, message dispatch, call recording and any live pilot remain disabled.

The historical QL-003 notes above describe only the older local inbox. The later public synthetic review panels and guarded read-only Supabase scaffold do **not** turn the app into a live communications platform.
