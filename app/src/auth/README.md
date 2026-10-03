# Auth boundary

QL-009 adds the first frontend auth boundary for Rosevear Comms Hub.

The boundary is intentionally conservative:

- local browser storage remains the default;
- Supabase client creation is feature-gated;
- live data access stays blocked until an allowlisted admin signs in;
- no anonymous table access is used;
- no customer data should be entered yet.

## Required frontend flags before live Supabase can be attempted

```text
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_HOSTED_DATABASE=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

Do not commit real keys to the repository.

## Backend guard

The database uses Supabase Auth plus `public.app_admins` as the admin allowlist. RLS policies require an authenticated user whose email matches an active row in `public.app_admins`.
