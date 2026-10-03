# Remote Operator Checklist — Admin Login

Use this checklist when the operator cannot run local Bash.

## Before enabling login

- Confirm `public.app_admins` contains the owner/admin email.
- Confirm the owner row is active.
- Confirm the owner brand scope includes `rosiedazzlers` and `devilndove`.
- Confirm Supabase Auth email provider is enabled.
- Confirm the app URL is added to Supabase Authentication redirect URLs.

## Environment values

Set only browser-safe values in the frontend environment:

```text
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
```

Never paste these into public issues, screenshots, or docs:

```text
service-role key
database password
DATABASE_URL
JWT secret
connection string
```

## Test

1. Open the app.
2. Confirm the admin login screen appears when flags are enabled.
3. Enter the owner/admin email.
4. Click the magic link email.
5. Confirm the app shows a verified owner/admin session banner.
6. Confirm the inbox remains local/demo data only.

## Stop conditions

Stop and do not continue to live data if:

- a non-allowlisted email can access the app;
- anonymous users can read tables;
- the app requests a service-role key;
- real customer data is required for the test;
- phone/SMS/AI setup is requested before the data-access build.
