# 08 — Build Sequence

## QL-001 — Structure and Documentation Foundation

Status: complete.

Goal:

- Create repository structure.
- Add source-of-truth docs.
- Add brand config files.
- Add data model draft.
- Add provider-neutral telephony notes.
- Add compliance notes.
- Add first implementation sequence.

Green criteria:

- Docs exist and are organized.
- Brand configs exist for RosieDazzlers and DevilnDove.
- Database schema draft exists.
- Telephony options are documented.
- No live phone/SMS connected.

## QL-002 — Application Scaffold

Status: complete.

Goal:

- Choose initial app framework.
- Create local development app shell.
- Add admin layout placeholder.
- Add brand switcher placeholder.
- Add placeholder inbox with brand-aware sample conversations.
- Add environment example file.
- Add basic typecheck/build commands.

Framework decision:

- Use Vite + React + TypeScript.
- Keep the app static-first and provider-neutral.
- Defer production hosting and backend runtime decisions.

Green criteria:

- App runs locally with `npm run dev` from `app/`.
- Typecheck command exists with `npm run check`.
- Build command exists with `npm run build`.
- Admin shell loads.
- Brand switcher exists.
- Placeholder inbox exists.
- No production deployment required yet.
- No live phone/SMS connected.

## QL-003 — Database and API Foundation

Goal:

- Implement local/shared data access pattern.
- Prepare API routes or worker contract.
- Implement contacts, conversations, messages, tasks, intake requests, tags, and audit events.
- Decide whether the first backend target is Supabase direct access, Cloudflare Worker, Vercel function, or small VPS API.

Green criteria:

- Migrations apply cleanly in a documented environment.
- Seed data creates both brands.
- App can load conversation data from a real local/API source, not only static sample files.
- No live phone/SMS connected.

## QL-004 — Admin Inbox MVP

Goal:

- Build inbox list.
- Build conversation detail.
- Build contact detail.
- Build task list.
- Allow manual conversation creation and status/tag changes.

Green criteria:

- Admin can manage test conversations for both brands.
- Status/tag/task workflow works.
- All AI/customer-send actions remain human-approved or disabled.
