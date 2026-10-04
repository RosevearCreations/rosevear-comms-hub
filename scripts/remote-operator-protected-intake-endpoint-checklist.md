# Remote Operator Checklist — Protected Intake Endpoint

Use this when QL-013 is reviewed or when a later deployment wants to enable the endpoint.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Current state

QL-013 is a skeleton only. Keep it disabled unless a later build explicitly deploys and wires persistence.

## Variables

Repository-wide browser-safe variables can stay in:

```text
Settings → Secrets and variables → Actions → Variables
```

Expected browser-safe variables:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_SUPABASE_LOGIN=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

## Protected intake endpoint values

When deploying a server-side endpoint, add:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ALLOWED_INTAKE_ORIGINS=https://rosiedazzlers.ca,https://devilndove.com,https://devilndove.online
```

Add this as a secret only when real endpoint testing begins:

```text
INTAKE_SHARED_SECRET=<long random shared secret>
```

Do not use the `VITE_` prefix for `INTAKE_SHARED_SECRET`.

## GitHub environments

Use these exact environment names only if a deployment workflow references environments:

```text
preview
production
```

## Do not use

Do not put any of these in frontend variables, screenshots, docs, or chat:

```text
sb_secret_...
service_role key
DATABASE_URL
database password
JWT secret
connection string
INTAKE_SHARED_SECRET
```

## Manual validation checklist

- Endpoint remains disabled by default.
- Secret is not committed.
- No public anonymous Supabase policy is added.
- No real customer data is sent.
- RosieDazzlers and DevilnDove payloads use accepted brand keys only.
- Persistence adapter is not wired until the next approved build.
