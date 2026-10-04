# Rosevear Comms Hub

Shared Quo-lite communication hub for RosieDazzlers and DevilnDove.

This repository is the source of truth and first runnable scaffold for a shared customer communication platform: contacts, conversations, phone/SMS readiness, quote/custom-order intake, follow-up tasks, and AI-assisted summaries/drafts.

## Current stage

**QL-013 — Protected Intake Endpoint Skeleton**

QL-013 adds the first provider-neutral server-side intake endpoint skeleton for future RosieDazzlers and DevilnDove website submissions.

The endpoint is disabled by default. It validates method, allowed origin, a server-side shared secret, brand, intake type, and required payload fields before returning dry-run success. It does not write live customer data until a later persistence adapter build.

The application frontend still does **not** perform live customer-data reads or writes. Customer records, conversations, messages, intakes, tasks, phone calls, and SMS remain local-only until a later build.

No live phone, SMS, AI sending, call recording, number forwarding, or number porting is active in this stage.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

GitHub repository page:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## Supabase project

```text
Project name: rosevearcreations Project
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
Status: ACTIVE_HEALTHY
```

Use this value for `VITE_SUPABASE_URL`:

```text
https://gxujcwpktaickcgzyvnu.supabase.co
```

Use the **Publishable key** from Supabase API Keys for `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not use the secret/service-role key in the browser.

## GitHub environments and variables

For this repository, use these GitHub Environment titles only when a deployment workflow requires environment-scoped settings:

```text
preview
production
```

Use repository-wide Actions variables first unless a workflow specifically says it uses environments.

Repository variables/secrets location:

```text
Settings → Secrets and variables → Actions
```

Browser-safe Vite values for login/reference-read testing:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_SUPABASE_LOGIN=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

Protected intake endpoint values for a future server-side deployment:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ALLOWED_INTAKE_ORIGINS=https://rosiedazzlers.ca,https://devilndove.com,https://devilndove.online
```

Only add this as a server-side secret when endpoint testing begins:

```text
INTAKE_SHARED_SECRET=<long random shared secret>
```

Do not commit service-role keys, secret keys, database passwords, JWT secrets, connection strings, or intake shared secrets.

## Auth redirect URLs

For local testing, add this Supabase Auth redirect URL:

```text
http://localhost:5173
```

For a hosted preview or production deployment, add the deployed app URL after it exists. Do not use the GitHub repo URL as the Supabase Auth redirect URL; the redirect URL must be the running app URL.

## Source of truth

Start here:

- [`docs/00_MASTER_SOURCE_OF_TRUTH.md`](docs/00_MASTER_SOURCE_OF_TRUTH.md)
- [`docs/01_DECISION_RECORD.md`](docs/01_DECISION_RECORD.md)
- [`docs/08_BUILD_SEQUENCE.md`](docs/08_BUILD_SEQUENCE.md)
- [`docs/20_SUPABASE_MIGRATION_VERIFIED.md`](docs/20_SUPABASE_MIGRATION_VERIFIED.md)
- [`docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md`](docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md)
- [`docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md`](docs/22_AUTH_BOUNDARY_SUPABASE_CLIENT_WIRING.md)
- [`docs/23_ADMIN_LOGIN_SESSION_VERIFICATION.md`](docs/23_ADMIN_LOGIN_SESSION_VERIFICATION.md)
- [`docs/24_SUPABASE_READ_MODEL_LOCAL_FALLBACK.md`](docs/24_SUPABASE_READ_MODEL_LOCAL_FALLBACK.md)
- [`docs/25_WEBSITE_INTAKE_INTEGRATION_DRAFT.md`](docs/25_WEBSITE_INTAKE_INTEGRATION_DRAFT.md)
- [`docs/26_PROTECTED_INTAKE_ENDPOINT_SKELETON.md`](docs/26_PROTECTED_INTAKE_ENDPOINT_SKELETON.md)

## Website intake path

QL-013 adds:

```text
api/endpoints/protectedIntakeEndpoint.ts
api/contracts/protected-intake-response.schema.json
api/contracts/protected-intake-example.request.json
```

The safe future path is:

```text
Public website form
→ protected server-side endpoint
→ validation + origin check + shared secret
→ dry run now / server-side write in a later build
→ admin review before reply
```

## Repository structure

```text
app/                    Vite React admin shell with local persistence and guarded Supabase auth/reference-read wiring
api/contracts/           API contract drafts and schemas
api/endpoints/           Provider-neutral server-side endpoint skeletons
brand-configs/           Brand-specific settings and workflows
database/                Schema, migrations, seeds, and hosted-backend notes
docs/                    Source-of-truth documentation
integrations/            RosieDazzlers, DevilnDove, and future connectors
scripts/                 Local/helper scripts and remote-operator checklists
telephony/               Phone/SMS provider-neutral integration notes
```

## QL-013 non-goals

- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not port any number yet.
- Do not auto-send AI replies.
- Do not record calls until consent language and storage rules are implemented.
- Do not enter real production customer data yet.
- Do not commit Supabase service-role keys, secret keys, database passwords, JWT secrets, connection strings, or intake shared secrets.
- Do not perform live customer-data reads/writes yet.
- Do not expose anonymous public Supabase table access.

## Next build

QL-014 — Intake Persistence Adapter Draft.
