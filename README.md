# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-002 — Application Scaffold**

QL-002 chooses a lightweight, static-first **Vite + React + TypeScript** admin shell. This keeps hosting flexible while Cloudflare/Vercel capacity decisions stay open.

No live phone, SMS, AI sending, call recording, number forwarding, or number porting is active in this stage.

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)
- [`docs/14_APPLICATION_SCAFFOLD.md`](docs/14_APPLICATION_SCAFFOLD.md)

## Run locally

```bash
cd app
npm install
npm run dev
```

Build check:

```bash
cd app
npm run check
npm run build
```

## Core decision

Build **one shared application** with brand workspaces:

- `rosiedazzlers`
- `devilndove`

RosieDazzlers is the first operational workflow because phone/quote handling is most urgent. DevilnDove is built into the architecture from day one.

## Repository structure

```text
app/                    Vite React admin shell
api/contracts/           API contract drafts
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, and seeds
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local helper scripts later
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-002 non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not create production hosting until the scaffold is useful locally.
