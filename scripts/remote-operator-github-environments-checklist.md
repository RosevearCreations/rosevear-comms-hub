# Remote Operator Checklist — GitHub environments and variables

Use this when configuring Rosevear Comms Hub without local Bash.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## What to create on the GitHub Environments page

Only create GitHub Environments when a workflow/deployment needs environment-scoped settings.

Recommended titles:

```text
preview
production
```

Use lowercase exactly.

Do not use `main` as an environment title. `main` is the branch name, not the environment.

## Where the Supabase values go

For repository-wide GitHub Actions builds, go to:

```text
Settings → Secrets and variables → Actions
```

Add browser-safe values as repository variables:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_SUPABASE_LOGIN=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

## Secret values that must not be added as Vite variables

Never add these to frontend/Vite variables:

```text
sb_secret_...
service_role key
database password
DATABASE_URL
JWT secret
connection string
```

A later protected-server build can use repository or environment secrets for server-only credentials.

## Supabase redirect URL

For local Vite testing:

```text
http://localhost:5173
```

For hosted deployment, add the deployed app URL after a deployment exists.
