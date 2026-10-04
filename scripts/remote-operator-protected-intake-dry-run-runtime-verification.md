# Remote Operator — Protected Intake Dry-Run Runtime Verification

## Build

QL-017 — Protected Intake Dry-Run Runtime Verification.

## No action required now

No manual setup is required for this build.

The dry-run verifier and documentation are committed to the repository, but the endpoint remains disabled.

## Later QL-018 setup steps

When preview deployment wiring begins:

1. Confirm Vercel is connected to `RosevearCreations/rosevear-comms-hub`.
2. Confirm the preview deployment URL.
3. Add `INTAKE_SHARED_SECRET` as a server-side secret only.
4. Confirm `ALLOWED_INTAKE_ORIGINS` includes only approved website origins.
5. Keep `ENABLE_PROTECTED_INTAKE_ENDPOINT=false` for the first preview deploy.
6. Keep `ENABLE_INTAKE_PERSISTENCE=false`.
7. Do not add service-role keys to Vite or browser variables.
8. Do not connect live RosieDazzlers or DevilnDove forms until the dry-run result is reviewed.

## Values that must not be pasted into chat

```text
INTAKE_SHARED_SECRET
service-role key
database password
DATABASE_URL
JWT secret
connection string
```
