# 08 — Build Sequence

## QL-001 — Structure and Documentation Foundation

Status: in progress.

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

Goal:

- Choose initial app framework.
- Create local development app shell.
- Add admin layout placeholder.
- Add environment example file.
- Add basic test/lint commands.

Decision needed before QL-002:

- framework: likely Next.js, Remix, or lightweight Vite/React plus API backend
- database: likely Supabase/Postgres
- hosting direction: deferred but considered

Green criteria:

- App runs locally.
- Admin shell loads.
- Brand switcher placeholder exists.
- No production deployment required yet.

## QL-003 — Database Foundation

Goal:

- Implement contacts.
- Implement conversations.
- Implement messages.
- Implement tasks.
- Implement intake requests.
- Implement tags.
- Implement audit events.

Green criteria:

- Migrations apply cleanly.
- Seed data creates both brands.
- CRUD works locally or through test scripts.

## QL-004 — Admin Inbox MVP

Goal:

- Build inbox list.
- Build conversation detail.
- Build contact detail.
- Build task list.
- Allow manual conversation creation.

Green criteria:

- Admin can manage test conversations for both brands.
- Status/tag/task workflow works.

## QL-005 — RosieDazzlers Intake MVP

Goal:

- Add detailing quote intake payload.
- Store customer, conversation, message, intake, task.
- Add service/condition flags.

Green criteria:

- A RosieDazzlers quote request creates the correct records.
- Admin can follow up from the hub.

## QL-006 — DevilnDove Intake MVP

Goal:

- Add custom order/product question intake payload.
- Store customer, conversation, message, intake, task.
- Add project categories and quote state.

Green criteria:

- A DevilnDove request creates the correct records.

## QL-007 — Phone-Ready Records

Goal:

- Add phone call manual entry.
- Add missed-call workflow.
- Add voicemail metadata fields.
- Add SMS-ready records without live provider.

Green criteria:

- Admin can manually log a missed call and create a follow-up.

## QL-008 — Test Number Integration

Goal:

- Connect one test phone provider or PBX path.
- No porting.
- No existing number risk.

Green criteria:

- Test call creates a phone call record.
- Missed test call creates a follow-up task.

## QL-009 — SMS Inbox Test

Goal:

- Test SMS on a non-critical number.
- Add opt-out and template rules.

Green criteria:

- Test inbound/outbound texts are stored correctly.
- Human approval remains required for AI drafts.

## QL-010 — AI Summaries and Drafts

Goal:

- Add summarization.
- Add missing-info checklist.
- Add draft replies.
- Add suggested tags.

Green criteria:

- AI drafts are clearly marked.
- Human approval is required.
- No auto-send exists.
