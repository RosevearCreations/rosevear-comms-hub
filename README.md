# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-004 — Admin Inbox MVP**

QL-004 adds the first usable local admin workflow: inbox filtering/search, contact detail, intake detail, task dashboard, and local export/import. The app still uses browser `localStorage` only; no production database or external phone/SMS/AI provider is connected.

No live phone, SMS, AI sending, call recording, number forwarding, or number porting is active in this stage.

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)
- [`docs/14_APPLICATION_SCAFFOLD.md`](docs/14_APPLICATION_SCAFFOLD.md)
- [`docs/15_DATABASE_API_FOUNDATION.md`](docs/15_DATABASE_API_FOUNDATION.md)
- [`docs/16_ADMIN_INBOX_MVP.md`](docs/16_ADMIN_INBOX_MVP.md)

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

The repository also has GitHub Actions configured to run the app check/build remotely on push and pull request. This is important because the current operator may not be running local Bash.

## Core decision

Build **one shared application** with brand workspaces:

- `rosiedazzlers`
- `devilndove`

RosieDazzlers is the first operational workflow because phone/quote handling is most urgent. DevilnDove is built into the architecture from day one.

## Repository structure

```text
app/                    Vite React admin shell with local persistence
api/contracts/           API contract drafts
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, and seeds
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local helper scripts later
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-004 non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not enter real production customer data yet.
- Do not create production hosting until the local workflow is worth preserving.
