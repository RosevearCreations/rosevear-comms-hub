# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-010 — Admin Login UI and Session Verification**

QL-010 adds the first admin login/session boundary. The app still defaults to local browser storage, but when the Supabase feature flags and publishable key are supplied it can show a Supabase magic-link login screen, read the auth session, and verify that the signed-in email is active in the `public.app_admins` allowlist.

The application frontend still does **not** perform live customer-data reads or writes. Live Supabase data access waits for the next data-access build after login is verified.

No live phone, SMS, AI sending, call recording, number forwarding, or number porting is active in this stage.

## Supabase project

```text
Project name: rosevearcreations Project
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
Status: ACTIVE_HEALTHY
```

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)
- [`docs/14_APPLICATION_SCAFFOLD.md`](docs/14_APPLICATION_SCAFFOLD.md)
- [`docs/20_SUPABASE_MIGRATION_VERIFIED.md`](docs/20_SUPABASE_MIGRATION_VERIFIED.md)
- [`docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md`](docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md)
- [`docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md`](docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md)
- [`docs/23_ADMIN_LOGIN_SESSION_VERIFICATION.md`](docs/23_ADMIN_LOGIN_SESSION_VERIFICATION.md)

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

## Login feature gates

QL-010 keeps Supabase login disabled unless all required browser-safe values are configured:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

Do not commit service-role keys, database passwords, JWT secrets, or connection strings.

## Core decision

Build **one shared application** with brand workspaces:

- `rosiedazzlers`
- `devilndove`

RosieDazzlers is the first operational workflow because phone/quote handling is most urgent. DevilnDove is built into the architecture from day one.

## Repository structure

```text
app/                    Vite React admin shell with local persistence and guarded Supabase auth wiring
api/contracts/           API contract drafts
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, seeds, and hosted-backend notes
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local/helper scripts and remote-operator checklists
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-010 non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not enter real production customer data yet.
- Do not commit Supabase service-role keys, database passwords, JWT secrets, or connection strings.
- Do not perform live customer-data reads/writes until the next data-access build.
