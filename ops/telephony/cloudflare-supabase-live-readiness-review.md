# QL-088 Ops Checklist — Cloudflare and Supabase Live Readiness Review

## Cloudflare

- Confirm final `main` commit has the check `Workers Builds: rosevear-comms-hub`.
- Confirm the check conclusion is `success`.
- Confirm the Cloudflare details URL points to the connected production Worker project under the `devilndovelive@gmail.com` account.
- Confirm no Worker secrets or live provider credentials are required by this static-assets deployment.

## Supabase

- Confirm Supabase project URL: `https://gxujcwpktaickcgzyvnu.supabase.co`.
- Confirm GitHub integration settings:
  - Repository: `RosevearCreations/rosevear-comms-hub`
  - Working directory: `.`
  - Production branch: `main`
- Confirm the dashboard can see the root `supabase/` folder.
- Confirm the synthetic migration and `ql-status` function scaffold are visible.

## Locked runtime

- Do not enable SMS sending.
- Do not enable call placement.
- Do not register provider callbacks.
- Do not read or write live customer data.
- Do not write archives or retention records.
- Do not enable live pilot runtime.
