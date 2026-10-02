# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is a documentation-first foundation for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-001 — Structure and Documentation Foundation**

No live phone, SMS, AI sending, call recording, number forwarding, or number porting is active in this stage.

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)

## Core decision

Build **one shared application** with brand workspaces:

- `rosiedazzlers`
- `devilndove`

RosieDazzlers is the first operational workflow because phone/quote handling is the most urgent. DevilnDove is built into the architecture from day one.

## Initial repository structure

```text
app/                    Future UI/app code and route notes
api/contracts/           API contract drafts
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, and seeds
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local helper scripts later
telephony/               Phone/SMS provider-neutral integration notes
```

## Non-goals for QL-001

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.

## First green target

The repository is ready for QL-002 when the docs define the business rules, data model, brand workflows, telephony options, privacy rules, and first build sequence clearly enough for implementation.
