# 31 — Protected Intake Preview Deployment Wiring

## Build

QL-018 — Protected Intake Preview Deployment Wiring.

## Result

QL-018 moves the protected intake wrapper from a template-only location into a real preview-capable route:

```text
api/intake.ts
```

This route is still safe by default because the handler returns disabled unless `ENABLE_PROTECTED_INTAKE_ENDPOINT=true` is set server-side.

QL-018 does not connect RosieDazzlers or DevilnDove public forms. It does not write customer records. It does not enable Supabase anonymous write policies.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/intake.ts
api/deployment/protectedIntakePreviewWiring.ts
api/contracts/protected-intake-preview-wiring.example.json
docs/31_PROTECTED_INTAKE_PREVIEW_DEPLOYMENT_WIRING.md
docs/builds/QL-018-protected-intake-preview-deployment-wiring.md
ops/deployment/protected-intake-preview-deployment-wiring.md
runtimes/vercel/preview-deployment-wiring.md
scripts/remote-operator-protected-intake-preview-deployment-wiring.md
```

## Safe current state

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
ENABLE_RATE_LIMITING=false
ENABLE_INTAKE_IDEMPOTENCY=false
DEPLOYMENT_TARGET=vercel
DEPLOYMENT_RUNTIME_WRAPPER=vercel_serverless_function
PROTECTED_INTAKE_PREVIEW_ROUTE=/api/intake
PROTECTED_INTAKE_PREVIEW_URL=
```

## Expected preview behavior

With the default safe environment, a request to the preview route should return:

```text
HTTP 503
mode: disabled
accepted: false
```

That is the desired QL-018 production-green behavior.

## What must stay server-side only

Do not put these values in Vite/browser variables:

```text
INTAKE_SHARED_SECRET
DATABASE_URL
DATABASE_READONLY_URL
service-role key
sb_secret_...
JWT secret
connection string
```

## Manual input required

No manual input is required to complete the QL-018 repository build.

Manual setup is only required when you want to run a real Vercel preview deployment. At that time:

```text
1. Open Vercel.
2. Import or select RosevearCreations/rosevear-comms-hub.
3. Confirm the project builds from the repository root unless a later build changes this.
4. Add server-side environment values in Vercel Project Settings → Environment Variables.
5. Keep ENABLE_PROTECTED_INTAKE_ENDPOINT=false for the first preview deploy.
6. Keep ENABLE_INTAKE_PERSISTENCE=false.
7. Add INTAKE_SHARED_SECRET as a Vercel secret/server-side variable only.
8. Record the generated preview URL as PROTECTED_INTAKE_PREVIEW_URL.
9. Test that /api/intake returns disabled before any enablement.
```

## Preview enablement gate for a later build

Before setting `ENABLE_PROTECTED_INTAKE_ENDPOINT=true`, confirm:

```text
INTAKE_SHARED_SECRET is present server-side
ALLOWED_INTAKE_ORIGINS is set
preview URL is known
rate-limit strategy is selected
idempotency strategy is selected
persistence remains disabled
no service-role key is exposed to browser code
```

## Production GREEN definition

For QL-018, production GREEN means:

```text
main contains the preview-capable /api/intake route
route is disabled by default
persistence is disabled
no public website form is connected
no customer data is written
no Supabase migration is required
```

## Non-goals

- Do not enable the endpoint yet.
- Do not enable persistence yet.
- Do not connect RosieDazzlers or DevilnDove forms yet.
- Do not write customer records.
- Do not expose service-role keys, database URLs, JWT secrets, or shared secrets.
- Do not enable public anonymous Supabase write policies.
- Do not enable phone/SMS.
- Do not enable AI auto-send.

## Next build

QL-019 — Protected Intake Preview Disabled-Mode Check.

Goal:

- Confirm the preview route returns disabled mode in the deployed preview environment.
- Keep persistence disabled.
- Keep public website forms disconnected.
