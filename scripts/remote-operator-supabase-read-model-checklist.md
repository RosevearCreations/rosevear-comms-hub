# Remote Operator Checklist — QL-011 Supabase Read Model

Use this when testing the QL-011 login/reference-read flow.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Supabase project URL

```text
https://gxujcwpktaickcgzyvnu.supabase.co
```

Use that value for:

```text
VITE_SUPABASE_URL
```

## Key to copy

From Supabase Project Settings → API Keys, copy only the **Publishable key**.

Set it as:

```text
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Never copy the secret key, service-role key, database password, JWT secret, or connection string into frontend environment variables or repo files.

## Local redirect URL

In Supabase Authentication → URL Configuration, add:

```text
http://localhost:5173
```

When a deployed preview exists, add that deployed app URL too.

Do not use the GitHub repository URL as an auth redirect URL.

## Browser-safe app environment

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

## Expected result

After signing in with the owner/admin email:

- Supabase session banner appears.
- Banner says reference read is verified.
- Banner shows 2 brand workspaces loaded.
- The inbox still uses local demo data.
- No real customer records should be entered yet.

## Stop conditions

Stop and review before continuing if:

- the app asks for a service-role key;
- the app reads or writes contacts/conversations/messages from Supabase;
- the signed-in email is blocked;
- the redirect link opens the wrong URL;
- any secret is exposed in the repo or browser console.
