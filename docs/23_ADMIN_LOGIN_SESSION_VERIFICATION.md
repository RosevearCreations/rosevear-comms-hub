# 23 — Admin Login UI and Session Verification

## Build

QL-010 — Admin Login UI and Session Verification.

## Result

QL-010 adds the first admin login/session UI boundary while keeping the app local-first by default.

The app can now be wrapped by `AdminSessionGate`, which:

- checks whether Supabase browser configuration is enabled;
- stays in local-only mode when it is not enabled;
- sends a Supabase magic link when enabled;
- reads the Supabase auth session;
- checks the signed-in email against `public.app_admins`;
- allows the admin app only when the email is active in the allowlist.

## Files changed

```text
app/src/auth/AdminSessionGate.tsx
app/src/main.tsx
.env.example
README.md
docs/08_BUILD_SEQUENCE.md
docs/23_ADMIN_LOGIN_SESSION_VERIFICATION.md
docs/builds/QL-010-admin-login-session-verification.md
scripts/remote-operator-admin-login-checklist.md
```

## Supabase verification performed

The live Supabase project was checked through the RosevearCreations connector.

Verification results:

- The owner allowlist row exists.
- The allowlist row is active.
- The role is `owner`.
- Brand scope includes `rosiedazzlers` and `devilndove`.
- RLS policies exist for the application tables and `app_admins`.

The owner's email is intentionally not written into this repo document.

## Runtime gates

The login screen only becomes active when the browser-safe Supabase values are configured:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

The app remains local-only when those values are missing or false.

## Important safety boundary

QL-010 verifies login/session state only.

It does not yet switch the inbox to live Supabase customer data.

Still disabled:

- live customer-data reads;
- live customer-data writes;
- customer self-service login;
- public anonymous table access;
- phone/SMS provider connection;
- AI auto-send;
- call recording.

## Owner setup steps

If you are testing locally or in a hosted preview, configure only browser-safe values:

1. Open Supabase dashboard for project `gxujcwpktaickcgzyvnu`.
2. Go to Project Settings → API.
3. Copy a publishable/anon browser key. Do not use the service-role key.
4. In the app environment, set:

```text
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key>
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
```

5. Go to Authentication → URL Configuration.
6. Add the local or deployed app URL as an allowed redirect URL.
7. Open the app.
8. Enter the owner/admin email that is active in `public.app_admins`.
9. Use the magic link in the email.
10. Confirm the app shows a verified owner/admin session banner.

Do not enter real customer records yet.

## Next build

QL-011 — Supabase Read Model and Local Fallback.

Goal:

- Read non-sensitive reference data from Supabase after verified login.
- Keep local demo inbox as fallback.
- Do not enable public website intake or phone/SMS yet.
