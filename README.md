# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-008B — Auth and Safe Admin Access Decision**

QL-008B defines the safe admin access model before the frontend reads or writes live Supabase data. The decision is **Supabase Auth + an app-owned admin allowlist** in `public.app_admins`, with authenticated-admin-only RLS policies.

The policy migration is prepared here:

```text
database/migrations/0006_auth_admin_access_policies.sql
```

In this turn, the available Supabase connector context returned a permission error for project `gxujcwpktaickcgzyvnu`, so the live QL-008B migration was not applied automatically. The migration is repo-ready and can be applied through the correct Supabase connection or manually in SQL Editor.

The application frontend still runs local-first and does **not** read/write live Supabase customer data yet. Auth and RLS policies must be verified before live app data access.

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
- [`docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md`](docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md)

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

The schema exists in Supabase, but the frontend must stay local-only until login and RLS policy verification are complete.

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

## QL-008B non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not enter real production customer data yet.
- Do not commit Supabase service-role keys, database passwords, JWT secrets, or connection strings.
- Do not connect the frontend to live Supabase data until auth/RLS policies are verified.
