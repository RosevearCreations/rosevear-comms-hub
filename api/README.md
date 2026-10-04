# API Folder

Provider-neutral API contracts and server-side endpoint skeletons for Rosevear Comms Hub.

## Current areas

```text
api/contracts/    JSON schemas and sample payloads
api/endpoints/    Server-side endpoint skeletons, not live deployments
```

## QL-013 protected intake boundary

`api/endpoints/protectedIntakeEndpoint.ts` is a disabled-by-default skeleton for future RosieDazzlers and DevilnDove website intake submissions.

It must remain server-side only and must not expose direct browser writes to Supabase app tables.

Relevant docs:

```text
docs/10_API_CONTRACTS.md
docs/25_WEBSITE_INTAKE_INTEGRATION_DRAFT.md
docs/26_PROTECTED_INTAKE_ENDPOINT_SKELETON.md
```
