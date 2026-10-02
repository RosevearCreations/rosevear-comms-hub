# 09 — Open Questions and Test Plan

## Open questions

### Business/process questions

1. What is the minimum acceptable RosieDazzlers job value?
2. Which services require photos before quote confirmation?
3. Should RosieDazzlers quote by starting price, price range, or quote-only for some services?
4. Which towns are inside normal service area?
5. What is the preferred response promise: same day, 24 hours, or best effort?
6. Which DevilnDove custom categories should be active first?
7. Should DevilnDove quote requests require a budget range?
8. Should we keep personal and business contacts separate when a phone number is shared?

### Technical questions

1. Which app framework should QL-002 use?
2. Should the database be Supabase/Postgres from day one?
3. Should the hub use its own auth or share auth with existing apps?
4. Should phone/SMS integrations run serverless or on a VPS?
5. Which provider is best for a test number?
6. Do we need real-time inbox updates?
7. Do attachments/photos live in this app, existing app storage, or external object storage?

### Number strategy questions

1. Should the Bell Fibe number ever be business-facing?
2. Should RosieDazzlers cell be forwarded before porting?
3. Should DevilnDove get a new business number to protect Laurie's personal number?
4. Do we need one shared main number with brand menu, or one number per brand?

## QL-001 test plan

Checklist:

- README explains the project.
- Docs cover decisions, product requirements, architecture, data model, workflows, telephony, compliance, and build sequence.
- Brand configs exist.
- Database draft exists.
- No live provider credentials exist.
- No existing phone numbers are modified.

## QL-002 test plan draft

- App installs locally.
- App starts locally.
- Admin shell loads.
- Brand switcher displays RosieDazzlers and DevilnDove.
- Placeholder inbox page loads.

## QL-003 test plan draft

- Migration applies cleanly.
- Seed data inserts both brand records.
- Contact creation works.
- Conversation creation works.
- Task creation works.
- Intake creation works.

## QL-008 phone test plan draft

Use a test number only.

Test cases:

1. Incoming answered call.
2. Missed call.
3. Voicemail left.
4. Unknown caller creates contact placeholder.
5. Existing caller links to existing contact.
6. Wrong-brand number does not pollute the other workspace.
7. No automated text is sent unless explicitly enabled.
