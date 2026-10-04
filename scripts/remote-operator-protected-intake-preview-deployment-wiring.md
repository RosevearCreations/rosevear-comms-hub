# Remote Operator — Protected Intake Preview Deployment Wiring

## QL-018

No manual input is required to complete the repository build.

## When preview testing begins

Use these steps only when ready to test Vercel preview deployment:

1. Open Vercel.
2. Select or import `RosevearCreations/rosevear-comms-hub`.
3. Confirm the preview deployment URL.
4. Add server-side environment values in Vercel Project Settings.
5. Keep `ENABLE_PROTECTED_INTAKE_ENDPOINT=false`.
6. Keep `ENABLE_INTAKE_PERSISTENCE=false`.
7. Store `INTAKE_SHARED_SECRET` as server-side only.
8. Do not add `INTAKE_SHARED_SECRET` to any `VITE_` variable.
9. Confirm `/api/intake` returns disabled before any enablement.

## Stop conditions

Stop and review if:

- the preview route writes data;
- any secret appears in browser code;
- anonymous Supabase write policies are proposed;
- production customer data is requested for testing.
