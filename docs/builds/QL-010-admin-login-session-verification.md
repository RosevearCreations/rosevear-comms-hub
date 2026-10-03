# QL-010 — Admin Login UI and Session Verification

## Scope

Add the first admin login/session shell for Rosevear Comms Hub.

## Completed

- Added `AdminSessionGate`.
- Wrapped the app entrypoint with the session gate.
- Added magic-link login UI for configured Supabase environments.
- Verified signed-in sessions against `public.app_admins`.
- Preserved local-only default behavior.
- Added owner setup checklist.
- Updated source-of-truth docs.

## Green criteria

- App remains usable in local-only mode with no Supabase key.
- Supabase client initializes only when feature flags and publishable key are present.
- Magic-link login UI exists.
- Signed-in email is checked against `public.app_admins`.
- Non-allowlisted users are blocked.
- No live customer-data reads/writes are enabled yet.
- No secrets are committed.

## Out of scope

- Public customer login.
- Live inbox data read/write.
- Website intake endpoints.
- Phone/SMS.
- AI auto-send.
- Call recording.
