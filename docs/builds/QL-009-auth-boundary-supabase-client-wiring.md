# QL-009 — Auth Boundary and Supabase Client Wiring

## Status

Complete.

## Completed

- Added guarded Supabase client factory.
- Added auth boundary helper.
- Added frontend feature flags for hosted database/client enablement.
- Applied admin access migration to Supabase.
- Seeded owner allowlist row privately in Supabase.
- Moved RLS helper functions to private schema.
- Verified Supabase security advisors return no security lints.
- Kept frontend live reads/writes disabled.

## Green criteria

- Supabase client code exists but does not create a client unless explicitly enabled.
- Auth boundary reports local-only or auth-required state.
- No service-role key or database URL is committed.
- RLS policies exist for authenticated allowlisted admins.
- Anonymous access remains disabled.
- No customer data is entered.
- Phone/SMS/AI remain off.

## Next

QL-010 — Admin Login UI and Session Verification.
