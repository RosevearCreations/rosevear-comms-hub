# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-007 — Supabase Migration Application and Verification**

QL-007 attempted to move from setup gate to migration application for the owner-supplied Supabase project. The automatic migration could not be applied because the connected Supabase tool does not currently have permission to manage project `gxujcwpktaickcgzyvnu`.

The app still runs locally and still stores demo data in browser `localStorage`; the Supabase project is **not connected live** from the app yet.

Supabase project target:

```text
Project account/name: rosevearcreations
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

No live phone, SMS, AI sending, call recording, number forwarding, or number porting is active in this stage.

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)
- [`docs/14_APPLICATION_SCAFFOLD.md`](docs/14_APPLICATION_SCAFFOLD.md)
- [`docs/15_DATABASE_API_FOUNDATION.md`](docs/15_DATABASE_API_FOUNDATION.md)
- [`docs/16_ADMIN_INBOX_MVP.md`](docs/16_ADMIN_INBOX_MVP.md)
- [`docs/17_SHARED_BACKEND_DECISION.md`](docs/17_SHARED_BACKEND_DECISION.md)
- [`docs/18_SUPABASE_PROJECT_SETUP_GATE.md`](docs/18_SUPABASE_PROJECT_SETUP_GATE.md)
- [`docs/19_SUPABASE_MIGRATION_VERIFICATION.md`](docs/19_SUPABASE_MIGRATION_VERIFICATION.md)

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

The repository also has GitHub Actions configured to run the app check/build remotely on push and pull request. This matters because the current operator may not be running local Bash.

## Backend direction

Use **Supabase/Postgres** as the first shared backend candidate for Rosevear Comms Hub.

QL-007 is a migration verification gate, not a live data cutover. The migration file is ready at:

```text
database/migrations/0004_supabase_dev_schema.sql
```

Automatic application requires Supabase connector access to project `gxujcwpktaickcgzyvnu`; otherwise the owner can use the manual SQL Editor steps in `docs/19_SUPABASE_MIGRATION_VERIFICATION.md`.

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
database/                Schema, migrations, seeds, and hosted-backend notes
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local/helper scripts and remote-operator checklists
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-007 non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not enter real production customer data yet.
- Do not commit Supabase service-role keys, database passwords, JWT secrets, or connection strings.
- Do not add anonymous public table policies before owner/admin auth is designed.
