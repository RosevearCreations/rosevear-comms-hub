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
- Add brand switcher.
- Add placeholder inbox.
- Add basic test/build commands.

Decision:

- Vite + React + TypeScript.

Green criteria:

- App shell exists.
- Admin shell loads locally when dependencies are installed.
- Brand switcher placeholder exists.
- No production deployment required.

## QL-003 — Database and API Foundation

Status: complete.

Goal:

- Add local persistence.
- Add local repository/API boundary.
- Add manual lead creation.
- Create contact + conversation + message + intake + follow-up task locally.
- Keep phone/SMS/AI disconnected.

Green criteria:

- Local data persists in browser storage.
- Manual lead creates the expected linked records.
- Status/note/task actions work locally.
- No external setup required.

## QL-004 — Admin Inbox MVP

Status: complete.

Goal:

- Improve the admin inbox into a usable local operator workflow.
- Add filters/search.
- Add contact detail.
- Add intake detail.
- Add task dashboard.
- Add local export/import.

Green criteria:

- Operator can filter conversations by status, tag, channel, and search query.
- Operator can view conversation, contact, intake, messages, and tasks.
- Operator can complete tasks.
- Operator can export/import local demo data.
- No real customer data or live provider is required.

## QL-005 — Shared Backend Decision and Foundation

Status: next.

Goal:

- Decide first shared backend path.
- Prepare hosted database/auth foundation.
- Keep the current local app usable while adding a backend seam.
- Do not connect live telephony yet.

Decision needed before QL-005:

- Use Supabase/Postgres now, or defer again?
- Should authentication be Supabase Auth, app-only admin gate, or another provider?
- Where will attachments/photos eventually live?
- Does this app need to be deployed immediately, or can it remain GitHub-only until backend is ready?

Likely green criteria:

- Backend decision recorded in ADR.
- Environment variables documented.
- Database migration updated for production-readiness.
- Local repository boundary can be swapped for backend API later.
- No phone/SMS provider connected yet.
