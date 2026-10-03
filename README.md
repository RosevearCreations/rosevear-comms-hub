# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-008A — Supabase Migration Verified and Types Generated**

QL-008A confirms the Rosevear Comms Hub Supabase project is connected through the Supabase tool, applies the development schema, verifies tables/RLS/brand seed rows, applies safety/performance advisor follow-ups, and stores generated Supabase TypeScript database types in the repo.

Supabase project:

```text
Project name: rosevearcreations Project
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
Status: ACTIVE_HEALTHY
```

The application frontend still runs local-first and does **not** read/write live Supabase customer data yet. Auth and RLS policies must be completed before live app data access.

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
- [`docs/20_SUPABASE_MIGRATION_VERIFIED.md`](docs/20_SUPABASE_MIGRATION_VERIFIED.md)

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

The schema now exists in Supabase, but the frontend must stay local-only until QL-008B/QL-009 defines admin authentication and safe RLS policies.

## Core decision

Build **one shared application** with brand workspaces:

- `rosiedazzlers`
- `devilndove`

RosieDazzlers is the first operational workflow because phone/quote handling is most urgent. DevilnDove is built into the architecture from day one.

## Repository structure

```text
app/                    Vite React admin shell with local persistence and generated DB types
api/contracts/           API contract drafts
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, seeds, and hosted-backend notes
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local/helper scripts and remote-operator checklists
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-008A non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not enter real production customer data yet.
- Do not commit Supabase service-role keys, database passwords, JWT secrets, or connection strings.
- Do not connect the frontend to live Supabase data until auth/RLS policies are intentionally added.
