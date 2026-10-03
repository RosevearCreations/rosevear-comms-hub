# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-009 — Auth Boundary and Supabase Client Wiring**

QL-009 adds a guarded Supabase browser client and frontend auth boundary while keeping the admin app local-first by default. Supabase live data access is now prepared, but it is still feature-gated behind `VITE_ENABLE_SUPABASE_CLIENT` and `VITE_ENABLE_HOSTED_DATABASE`.

The QL-008B admin access migration was applied to Supabase, the owner allowlist row was seeded privately, RLS policies exist for authenticated allowlisted admins, and the RLS helper functions were moved to the private `app_private` schema.

Supabase security advisors returned no security lints after the QL-009 private-helper migration.

The application frontend still does **not** read/write live Supabase customer data by default. QL-010 must add login/session verification before the inbox uses live data.

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
- [`docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md`](docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md)

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

The schema and admin policies now exist in Supabase, but the frontend must stay local-only until login and session verification are complete.

## Core decision

Build **one shared application** with brand workspaces:

- `rosiedazzlers`
- `devilndove`

RosieDazzlers is the first operational workflow because phone/quote handling is most urgent. DevilnDove is built into the architecture from day one.

## Repository structure

```text
app/                    Vite React admin shell with local persistence, auth boundary, and generated DB types
api/contracts/           API contract drafts
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, seeds, and hosted-backend notes
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local/helper scripts and remote-operator checklists
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-009 non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not enter real production customer data yet.
- Do not commit Supabase service-role keys, database passwords, JWT secrets, or connection strings.
- Do not switch the inbox from local data to live Supabase data until QL-010 verifies login/session handling.
