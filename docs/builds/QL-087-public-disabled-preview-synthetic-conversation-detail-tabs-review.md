# QL-087 — Public Disabled Preview Synthetic Conversation Detail Tabs Review

Status: planned for promotion.

## Included

- Reviewed QL-086 local detail tabs.
- Added Cloudflare Worker static-assets config.
- Added root Supabase scaffold for GitHub integration.
- Added safe synthetic migration with read-only RLS policies.
- Added `ql-status` Supabase Edge Function scaffold.
- Added guard and contract fixture.

## Promotion checks

- Feature PR to `dev` must pass app CI.
- Promotion PR to `main` must pass app CI.
- Final `main` app CI must pass.
- Final GitHub Pages Disabled Preview build/deploy must pass.

## Manual post-promotion checks

- In Cloudflare, confirm production branch remains `main`.
- In Cloudflare, set build command to `npm run build` if it is still blank.
- In Supabase GitHub integration, use working directory `.` and production branch `main`, then enable integration.

## Runtime boundary

Cloudflare static-assets and Supabase synthetic scaffold testing are allowed. Live communications runtime remains blocked.
