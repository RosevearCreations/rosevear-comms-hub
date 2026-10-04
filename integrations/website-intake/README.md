# Website Intake Integration

QL-012 prepares the website intake contract for RosieDazzlers and DevilnDove.

This folder is contract-first only. It does not connect live website forms yet.

## Current safety rules

- Public websites must not write directly into Supabase tables.
- Public anonymous Supabase table policies stay disabled.
- Server-side validation and a shared secret or signed request are required before any live write path is added.
- Admin review remains required before replying to customers.

## Contract files

```text
api/contracts/website-intake.schema.json
integrations/website-intake/websiteIntakeContract.ts
```

## Accepted brands

```text
rosiedazzlers
devilndove
```

## Next step

QL-013 should add a protected endpoint skeleton that can receive this payload, validate it, and remain disabled until secrets and deployment settings are ready.
