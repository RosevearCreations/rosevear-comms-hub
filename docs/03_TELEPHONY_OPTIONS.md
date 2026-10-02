# 03 — Telephony Options

## Purpose

Document phone/SMS paths without committing too early.

## Current known numbers

- Bell Fibe home phone number exists.
- RosieDazzlers uses a cell phone.
- DevilnDove uses another number that is also Laurie's personal cell.

## Main rule

Do not port or risk existing numbers until the hub is proven with a test workflow.

## What the phone layer must eventually do

Minimum useful phone support:

- log incoming calls
- log missed calls
- log outgoing calls
- capture caller ID where available
- create a contact if not known
- create a conversation
- create a follow-up task
- store voicemail metadata
- store transcript later
- send or draft a missed-call reply text later

Advanced support later:

- call recording with consent
- voicemail transcription
- call summaries
- SMS inbox
- scheduled follow-up texts
- call routing
- business-hours handling
- AI answering

## Option A — Keep existing numbers and manually log calls

Good for earliest workflow testing.

Pros:

- no cost
- no number risk
- no porting
- validates workflow first

Cons:

- no automatic call logging
- no SMS inbox
- depends on manual entry

## Option B — Use a new VoIP test number

Recommended first live phone experiment.

Pros:

- protects existing numbers
- allows real testing
- can forward calls from existing numbers later
- easy to abandon if provider is wrong

Cons:

- new number is not what customers already know
- may have monthly/per-minute/per-SMS cost

## Option C — Forward Bell Fibe home phone to a test number

Useful only if the Bell number is part of the communication strategy.

Pros:

- no porting
- reversible
- can test how forwarded calls behave

Cons:

- forwarded caller ID behavior may vary
- home line may not be appropriate as a business number
- still requires a receiving VoIP/cell destination

## Option D — Forward RosieDazzlers cell to a test number

Possible if call forwarding is available and reliable.

Pros:

- safer than porting
- lets existing customers use known number

Cons:

- may affect normal phone use
- forwarded SMS is usually not equivalent to SMS API integration

## Option E — Port RosieDazzlers cell later

Only consider after the system works with a test number.

Pros:

- centralizes business calls/texts
- strongest long-term business workflow

Cons:

- risk during port
- may disrupt customer contact
- SMS/MMS behavior depends on provider

## Option F — Do not port Laurie personal/DevilnDove dual-use number first

Recommendation: avoid early porting.

Reason: personal and business use are mixed. Better to create or test a separate DevilnDove business number later.

## Platform candidates

### FreePBX/Asterisk

Best for open/custom PBX control.

Pros:

- open-source PBX path
- flexible
- can use SIP trunks
- supports advanced custom flows

Cons:

- needs server/VPS or hardware
- more technical upkeep
- SMS often still requires external provider

### 3CX

Good for easier PBX management.

Pros:

- polished PBX experience
- softphones and routing can be easier

Cons:

- deeper API/AI control may require paid licensing
- less open than Asterisk

### Twilio/Telnyx/SignalWire/VoIP provider APIs

Good for API-first phone/SMS.

Pros:

- easier webhooks
- strong SMS/call APIs
- no PBX needed for basic flows

Cons:

- not free
- Canadian SMS and number rules need checking
- voice/SMS costs scale with usage

### VoIP.ms

Often useful for Canadian small-business VoIP.

Pros:

- Canadian-friendly option to investigate
- DID/SIP trunk use possible

Cons:

- API/SMS feature fit must be tested
- still not free

## Recommended path

1. Build the app/inbox with manual call records.
2. Add phone-ready data fields.
3. Test with a new VoIP number.
4. Add missed-call task creation.
5. Add voicemail/transcript workflow.
6. Add SMS only after consent/templates are ready.
7. Consider forwarding existing numbers.
8. Consider porting only after the system is proven.

## First phone experiment success criteria

A test phone call should create or update:

- contact
- phone call record
- conversation
- follow-up task
- brand assignment
- status: `needs_reply`

No customer-facing automatic message is required for the first phone experiment.
