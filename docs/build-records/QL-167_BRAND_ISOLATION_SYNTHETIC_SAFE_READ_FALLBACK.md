# QL-167 — Brand Isolation & Synthetic Safe-Read Fallback Regression

The public disabled preview remains read-only and synthetic. QL-167 hardens its existing optional Supabase public-view safe-read path and adds deterministic failure regressions.

## Changes

- Query the allowlisted synthetic conversation view with an explicit selected `brand_id` filter. Do not fetch the other brand's records and filter only in browser memory.
- Independently verify the returned brand ID and canonical display name before hydration. A foreign brand row or a brand-name mismatch rejects the **whole conversation batch**; mixed valid and invalid records must never partially hydrate.
- Treat absent, non-array, oversized (more than 100), duplicate-ID, null, unexpected-field, private-field, unsafe-status and malformed values as failed batches. Do the same for untrusted system-status reads, independently of conversations.
- Fall back to the QL-165 version-pinned local samples for the affected dataset, still scoped to the selected brand. Never show an unvalidated remote row or ignore a malformed neighbour in the same batch.
- Expose testable, pure batch reconciliation for synthetic fixtures, so CI covers these errors without contacting Supabase, customer data, providers or the network.
- Keep UI render, locked actions and permission boundaries unchanged. The only Cloudflare configuration edit is a nonfunctional release-check comment.

## Acceptance

- `npm ci --no-audit --no-fund`, `npm run check`, `npm test`, `npm run build`, `npm run pages:build` in `app/`.
- QL-164 through QL-166 regression suites remain passing, with additional QL-167 brand isolation and fallback cases.
- Exact feature PR-head `app-build` SUCCESS before merge to `dev`, exact promotion PR-head `app-build` SUCCESS before merge to `main`, and **all five** check results SUCCESS on the final `main` SHA: app-build, Build disabled preview, Deploy disabled preview, Supabase Preview and Workers Builds.

No Supabase schema/credential change, read enablement, browser write, customer record, real approval/closure, export, live calls/SMS, callbacks, or AI send is approved by QL-167.

Next: **QL-168 — Unresolved Hold Prioritization & Evidence Summary**.
