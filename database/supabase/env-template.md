# Supabase Environment Template

Use this only as a reference. Do not commit real secret values.

## Browser-safe values later

These may be used by the frontend only after auth/RLS policies are ready:

```env
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=replace_with_publishable_key
```

## Server-only values later

These must never be exposed to browser code and must never be committed:

```env
SUPABASE_PROJECT_REF=gxujcwpktaickcgzyvnu
SUPABASE_SERVICE_ROLE_KEY=never_commit_this
DATABASE_URL=postgresql://never-commit-real-connection-strings
```

## Current QL-006 rule

The app still uses localStorage. These values are not required yet.
