# 25 — Website Intake Integration Draft

## Build

QL-012 — Website Intake Integration Draft.

## Result

QL-012 defines the first safe website-to-hub intake integration plan for RosieDazzlers and DevilnDove.

This is a contract and operations build only. It does not expose public anonymous database access and does not connect either public website to live Supabase yet.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## GitHub environment names

For this repository, use these environment titles only when you are setting up deployment-specific GitHub Actions variables or approvals:

```text
preview
production
```

Use lowercase names so workflow files can reference them exactly.

Do not create random environment names such as `main`, `prod`, `dev`, or `rosevearcreations Project` unless a workflow explicitly requires them.

## Where environment values belong

### Current immediate need

For Supabase login testing, use **GitHub repository variables/secrets** or your deployment provider variables, not the GitHub Environments page unless a deployment workflow is already using environments.

In GitHub, the safest path is:

```text
Repository → Settings → Secrets and variables → Actions
```

Add browser-safe Vite values as repository **Variables**:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_SUPABASE_LOGIN=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

The publishable key is browser-safe when RLS is configured, but it is still better to manage it carefully and never confuse it with the secret key.

### Never put these in browser variables

Do not put these in Vite variables, frontend code, screenshots, docs, or chat:

```text
sb_secret_...
service_role key
database password
DATABASE_URL
JWT secret
connection string
```

## Supabase project

```text
Project name: rosevearcreations Project
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

Use this exact value for `VITE_SUPABASE_URL`:

```text
https://gxujcwpktaickcgzyvnu.supabase.co
```

## Auth redirect URL

For local Vite testing, add this in Supabase Authentication → URL Configuration:

```text
http://localhost:5173
```

For hosted preview or production testing, add the deployed app URL after the app is deployed.

Do not use the GitHub repository URL as the Supabase Auth redirect URL. The redirect URL must be the running web app URL.

## Intake security design

Public websites must not write directly to Supabase tables with anonymous permissions.

The safe design is:

```text
Public website form
→ server-side endpoint / function
→ verifies origin + rate limits + payload shape + shared secret or signed request
→ writes intake request through protected server credentials
→ hub admin reviews before any customer reply
```

QL-012 prepares the contract but does not create a live endpoint.

## Brand routing

Accepted brand keys:

```text
rosiedazzlers
devilndove
```

Every intake payload must include one brand key and one intake type.

## RosieDazzlers intake types

```text
detailing_quote
booking_request
fleet_commercial_inquiry
missed_call_follow_up
```

## DevilnDove intake types

```text
custom_order
product_question
personalization_request
maker_story_candidate
```

## Payload contract

See:

```text
api/contracts/website-intake.schema.json
```

The TypeScript contract draft is here:

```text
integrations/website-intake/websiteIntakeContract.ts
```

## Non-goals

- Do not add anonymous Supabase table policies.
- Do not expose direct browser writes into `contacts`, `conversations`, `messages`, `intake_requests`, or `follow_up_tasks`.
- Do not connect RosieDazzlers or DevilnDove production websites yet.
- Do not send automatic AI replies.
- Do not connect phone/SMS.
- Do not enter real customer records yet.

## Next build

QL-013 — Protected Intake Endpoint Skeleton.

Goal:

- Add the first server-side intake endpoint skeleton.
- Keep it disabled by default.
- Require server-side validation and a secret/signature before writing anything live.
