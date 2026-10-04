# Remote Operator Checklist — QL-015 Protected Intake Deployment Readiness

Use this when working remotely through GitHub without local Bash.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Branch path

```text
dev → main
```

## Current safe variables

Keep these disabled:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

## Server-only secret later

Only add this when endpoint testing begins:

```text
INTAKE_SHARED_SECRET=<long random server-side secret>
```

Do not paste the value into chat.
Do not prefix it with `VITE_`.

## GitHub environments

Use only these environment names when needed:

```text
preview
production
```

For simple repo-wide values, use:

```text
Settings → Secrets and variables → Actions
```

## Supabase Auth redirect reminders

Local app URL:

```text
http://localhost:5173
```

Hosted preview/production app URLs must be added after deployment exists.

Do not use the GitHub repository URL as a redirect URL.

## Ready for next build when

- QL-015 docs are on `main`.
- Runtime target is selected or ready to select.
- Live intake remains disabled.
- No secrets are exposed.
