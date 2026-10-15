# QL-123 — Production revalidation after dev-sync Cloudflare failure

## Reason
The QL-123 implementation was already promoted on both `dev` and `main`, commit `8847124b4da977ed49557a7497849c02cef73afd`. The main deployment produced successful app-build, disabled-preview build and deploy, Supabase Preview and Cloudflare Workers build checks. Synchronizing `dev` to the same commit later triggered a distinct Cloudflare Worker build with a failure on that SHA, which can make the GitHub head appear red even while the main production deployment succeeded.

The failed external Worker build is:
https://dash.cloudflare.com/c0d5bc25df16ae5b7d47c985c4b7b787/workers/services/view/rosevear-comms-hub/production/builds/05c1a37d-87a1-4332-a8dd-255d28dbca46

GitHub checks do not expose the underlying Cloudflare build log, so do not claim its root cause is determined or fixed.

## Bounded revalidation
- Revalidate QL-123 without changing the behavior or runtime of the Worker or operator preview. A comment-only change in `wrangler.jsonc` triggers a new Worker production build on main.
- Require passing pull-request App CI before both merges.
- On the exact new main SHA, independently verify successful: `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, and `Workers Builds: rosevear-comms-hub`.
- Keep `main` as the final production release head; do not resynchronize `dev` after the production merge solely to equalize merge SHAs if that would trigger another distinct Cloudflare build on the released SHA. `dev` may be one merge commit behind with the same code content.
- Do not overwrite failures or claim that Cloudflare's dev-branch build problem has been repaired without direct Cloudflare log/setting verification.

## Safety
Owner approval is not granted. QL-123 does not enable ledger writes, persistence, schema/migrations, browser/API submit, provider calls, Phone/SMS, callbacks, recordings, consent capture, AI sending, or a live pilot.

## Subsequent milestone
QL-124 — Public Disabled Preview Safe Read Operator Acceptance Evidence Ledger Persistence Bounded Implementation Owner Decision Packet Review Follow-Up Readiness Decision Review
