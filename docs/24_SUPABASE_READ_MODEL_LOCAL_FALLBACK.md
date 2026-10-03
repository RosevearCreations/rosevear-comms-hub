# 24 — Supabase Read Model and Local Fallback

## Build

QL-011 — Supabase Read Model and Local Fallback.

## Result

QL-011 adds the first safe frontend Supabase read model after verified owner/admin login.

The app still defaults to local browser storage. When the browser-safe Supabase feature gates are enabled and the owner/admin signs in, the app may read only reference data:

- `public.brands`
- the signed-in admin's own `public.app_admins` allowlist row

No live customer data is read or written in this build.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
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

## API key to use

Use the **Publishable key** shown in Supabase Project Settings → API Keys.

Set it as:

```text
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Do not use the secret key, service-role key, database password, JWT secret, or connection string in the browser or in the repo.

## Auth redirect URL

For local testing, add this in Supabase Authentication → URL Configuration:

```text
http://localhost:5173
```

For hosted preview or production testing, add the deployed app URL after the app is deployed.

Do not use the GitHub repository URL as the Auth redirect URL. The redirect URL must be the URL where the web app is running.

## Runtime flags

The app stays local-only unless all of these are configured:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

## Frontend behavior

When Supabase is not configured:

- the app shows a local-only banner;
- all demo data remains in browser storage;
- no Supabase request is made.

When Supabase is configured and the admin is signed in:

- Supabase Auth session is checked;
- `public.app_admins` verifies the signed-in email;
- safe reference data is loaded from `public.brands`;
- the admin banner shows the reference read status;
- customer-data reads and writes remain disabled.

## Supabase verification

The live Supabase project contains brand reference rows:

```text
devilndove    DevilnDove      artisan_custom_products  planned
rosiedazzlers RosieDazzlers   mobile_auto_detailing    planned
```

An active owner allowlist row exists, but the owner email is intentionally not written in repo docs.

## Non-goals

- Do not read live contacts, conversations, messages, intakes, tasks, phone calls, or SMS from Supabase yet.
- Do not write live customer data yet.
- Do not enable customer self-service login.
- Do not expose anonymous table reads or writes.
- Do not connect phone/SMS.
- Do not enable AI auto-send.
- Do not record calls.

## Next build

QL-012 — Website Intake Integration Draft.

Goal:

- Prepare RosieDazzlers and DevilnDove server-to-server intake payloads.
- Keep public anonymous table access disabled.
- Do not connect phone/SMS yet.
