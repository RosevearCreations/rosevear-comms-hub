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

## QL-002 — Application Scaffold

Status: complete.

Goal:

- Choose initial app framework.
- Create local development app shell.
- Add admin layout placeholder.
- Add brand switcher.
- Add placeholder inbox.
- Add basic typecheck/build commands.

Decision:

- Use Vite + React + TypeScript for the first local admin shell.

## QL-003 — Database and API Foundation

Status: complete.

Goal:

- Replace static-only screen data with a local repository layer.
- Add browser localStorage persistence for safe local workflow testing.
- Add contact, conversation, message, intake, task, and audit event TypeScript types.
- Add a local API facade so the UI does not depend directly on storage details.
- Add interactive create/status/note/task actions.
- Expand API contract drafts.
- Add SQL index/constraint draft for the future hosted database.

Green criteria:

- App still runs locally.
- Admin can create a local lead.
- Local lead creates contact + conversation + message + intake + task.
- Admin can change conversation status.
- Admin can add an internal note.
- Admin can create and complete local follow-up tasks.
- Reset local demo data works.
- No live phone/SMS/AI/database provider is connected.

## QL-004 — Admin Inbox MVP

Goal:

- Improve inbox filtering and search.
- Add contact detail view.
- Add intake request detail view.
- Add task dashboard.
- Add status/tag filters.
- Add local export/import for backup during pre-hosted development.

Green criteria:

- Admin can manage test conversations for both brands.
- Status/tag/task workflow is usable from one screen.
- No external setup required yet.

## QL-005 — Hosted Database Decision Gate

Goal:

- Decide whether to use Supabase/Postgres now or continue local-only.
- Decide auth path.
- Decide attachment/photo storage path.

Setup may be needed here if we want shared data across devices.

## QL-006 — Website Intake Integration Draft

Goal:

- Prepare RosieDazzlers and DevilnDove server-to-server intake payloads.
- Do not expose unauthenticated public write endpoints.

## QL-007 — Phone/SMS Provider Test Decision

Goal:

- Choose a test number approach.
- Compare VoIP.ms, Telnyx, Twilio, FreePBX/Asterisk, and 3CX again with real workflow needs.

Setup will be needed here for a test number or phone provider account.
