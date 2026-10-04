# QL-013 — Protected Intake Endpoint Skeleton

## Status

Complete.

## Goal

Add a server-side intake endpoint skeleton that can later receive website submissions from RosieDazzlers and DevilnDove without exposing anonymous Supabase table writes.

## Scope completed

- Added provider-neutral handler skeleton.
- Added shared-secret and origin checks.
- Added payload validation using the QL-012 website intake contract.
- Added dry-run behavior when no persistence adapter is wired.
- Added response schema and example request payload.
- Updated source-of-truth docs and build sequence.
- Documented repository variables versus secrets.

## Safety decisions

- Endpoint is disabled by default.
- `INTAKE_SHARED_SECRET` is server-only and must not use the `VITE_` prefix.
- No live Supabase customer-data writes are performed.
- Public anonymous table policies remain disabled.
- Real customer data should not be submitted yet.

## Green criteria

- The endpoint skeleton exists in `api/endpoints/protectedIntakeEndpoint.ts`.
- The endpoint rejects non-POST requests.
- The endpoint rejects requests when disabled.
- The endpoint requires a server-side shared secret when enabled.
- The endpoint validates brand and intake type against the website intake contract.
- The endpoint returns dry-run success when validation passes and persistence is not wired.
- README and build sequence reflect QL-013.

## Next build

QL-014 — Intake Persistence Adapter Draft.
