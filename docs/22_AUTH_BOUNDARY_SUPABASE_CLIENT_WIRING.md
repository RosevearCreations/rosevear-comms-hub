# 22 — Auth Boundary and Supabase Client Wiring

## Build

QL-009 — Auth Boundary and Supabase Client Wiring.

## Result

QL-009 adds the first frontend Supabase wiring while keeping live data protected behind feature flags and an auth boundary.

The app still defaults to local browser storage.

## Supabase/Auth state

The Rosevear Comms Hub Supabase project is connected:

```text
Project ref: gxujcwpktaickcgzyvnu
Project URL: https://gxujcwpktaickcgzyvnu.supabase.co
```

QL-009 also applied the QL-008B admin access migration and seeded the owner allowlist row for the ChatGPT account email:

```text
role: owner
active: true
brand_scope: rosiedazzlers, devilndove
```

No password, service-role key, database URL, or JWT secret was committed.

## Frontend files added

```text
app/src/supabase/client.ts
app/src/auth/authBoundary.ts
app/src/auth/README.md
```

The Supabase client is only created when all frontend gates are true/present:

```text
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_HOSTED_DATABASE=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

## Database migrations applied in Supabase

```text
ql_008b_auth_admin_access_policies
ql_009_move_rls_helpers_private_schema
```

The second migration moved SECURITY DEFINER RLS helper functions into `app_private` so they are not exposed as public RPC functions.

## Security advisor result

After the private-helper migration, Supabase security advisors returned no security lints.

## What remains disabled

- The admin UI does not yet perform live Supabase reads or writes.
- No real customer data should be entered yet.
- No anonymous table access is enabled.
- No customer login is enabled.
- No phone/SMS provider is connected.
- No AI auto-send is enabled.
- No call recording is enabled.

## Why live data is still off

QL-009 wires the boundary, but QL-010 should add the actual login screen/session handling and verify that an allowlisted owner can sign in before the inbox reads from Supabase.

## Next build

QL-010 — Admin Login UI and Session Verification.

Goal:

- Add login/logout UI.
- Read Supabase auth session.
- Verify the signed-in user is allowlisted.
- Keep local-only data as fallback.
- Do not yet import real customer data.
