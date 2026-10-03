# QL-008B — Auth and Safe Admin Access Decision

## Status

Repo-ready. Live Supabase application was blocked in this turn by connector permission context.

## Completed

- Added `database/migrations/0006_auth_admin_access_policies.sql`.
- Added owner/admin allowlist decision docs.
- Preserved local-first frontend boundary.
- Kept anonymous access closed.
- Kept phone/SMS/AI out of scope.

## Acceptance criteria

- Auth path documented as Supabase Auth + app-owned `app_admins` allowlist.
- RLS policies are defined for authenticated admins only.
- No public anonymous table policies are added.
- No real secrets are committed.
- Frontend remains local-first until login/policy verification is complete.

## Blocker

The current Supabase connector context did not have permission to apply this build's live migration to project `gxujcwpktaickcgzyvnu`.

## Next step

Apply `database/migrations/0006_auth_admin_access_policies.sql` through the correct Supabase connection or manually in Supabase SQL Editor, then verify policies and owner row.
