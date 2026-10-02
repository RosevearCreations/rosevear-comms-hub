# 02 — Product Requirements

## Product name

Rosevear Comms Hub.

## Internal nickname

Quo-lite.

## Product goal

Create a shared front-desk communication hub that helps RosieDazzlers and DevilnDove capture, organize, summarize, and follow up on customer communication.

## Primary users

- Owners/operators managing leads and customers.
- Future helpers/team members who may need controlled access.

## Customer channels eventually supported

- Website quote forms
- Website custom order forms
- Manual admin-created contacts
- Phone calls
- Missed calls
- Voicemail
- SMS/text
- Email-style message capture later
- AI-assisted intake/chat later

## Phase 1 capabilities

### Contact management

The app must store customer profiles with name, email, phone, town, brand relationship, notes, and source.

### Brand-aware conversations

Each conversation belongs to one brand.

Conversation sources may include:

- website form
- manual entry
- phone call
- missed call
- voicemail
- SMS
- email later
- system task

### Messages and notes

Store customer messages, internal notes, AI draft replies, and approved outgoing replies.

### Follow-up tasks

Every lead can have follow-up tasks with due dates, status, priority, and relationship to contacts/conversations.

### Tags and statuses

Must support customer triage:

- New
- Needs Reply
- Waiting on Customer
- Needs Photos
- Quote Needed
- Quote Sent
- Booked
- Completed
- Archived

### AI support

AI may create:

- conversation summary
- missing information checklist
- suggested tags
- draft response
- next-step recommendation
- lead quality signal

AI output must be marked as AI-generated and must require human review before sending.

## RosieDazzlers requirements

The system must support:

- vehicle type
- service area
- service/package requested
- add-ons requested
- photos requested/received
- vehicle condition flags
- quote status
- booking status
- deposit/payment status later
- weather/reschedule notes later
- fleet/commercial inquiries

Important RosieDazzlers flags:

- pet hair
- odor
- salt stains
- heavy stains
- ceramic coating
- paint correction
- engine bay
- headlight restoration
- fleet/commercial
- needs photos
- outside service area
- high-effort/low-fit review

## DevilnDove requirements

The system must support:

- product question
- custom order request
- material preferences
- personalization text
- reference photos
- budget range
- deadline
- shipping/pickup needs
- tariff/shipping notice context
- maker-story handoff later

Important DevilnDove flags:

- custom jewelry
- engraving
- candle
- sublimation
- 3D print
- CNC/laser
- resin
- repair/alteration
- gift deadline
- needs reference photos
- needs human quote

## Non-functional requirements

- Must be simple enough to operate from a desktop.
- Must not require live phone integration before the inbox works.
- Must preserve brand separation.
- Must preserve auditability: who changed status, who approved a draft, what was sent.
- Must support future phone/SMS integration without redesign.
- Must avoid sending messages automatically until explicitly enabled.

## MVP success criteria

QL-002/QL-003 are successful when:

- Admin can create a contact.
- Admin can create a conversation for either brand.
- Admin can tag/status a conversation.
- Admin can create follow-up tasks.
- RosieDazzlers quote intake can become a contact/conversation/intake/task.
- DevilnDove custom intake can become a contact/conversation/intake/task.
- Phone-call records can be stored manually before live provider integration.
