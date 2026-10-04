# 27 — Intake Persistence Adapter Draft

## Build

QL-014 — Intake Persistence Adapter Draft.

## Result

QL-014 adds the first server-side draft for turning a validated website intake payload into the hub records that will eventually be stored.

This build does not enable live writes. It does not expose browser writes to Supabase. It does not create any anonymous Supabase policies.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

Repository URL:

```text
https://github.com/RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/persistence/intakePersistenceAdapter.ts
api/persistence/README.md
api/contracts/intake-persistence-plan.schema.json
api/contracts/intake-persistence-example.plan.json
docs/27_INTAKE_PERSISTENCE_ADAPTER_DRAFT.md
docs/builds/QL-014-intake-persistence-adapter-draft.md
scripts/remote-operator-intake-persistence-checklist.md
```

## What the adapter maps

The persistence adapter draft maps one validated QL-012 website intake payload into these planned records:

```text
contacts
contact_brand_profiles
conversations
messages
intake_requests
follow_up_tasks
audit_events
```

## Current mode

The adapter is provider-neutral and dependency-injected. It can produce a dry-run persistence plan without writing to a database.

Live persistence requires all of the following in a later build:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=true
ENABLE_INTAKE_PERSISTENCE=true
INTAKE_SHARED_SECRET=<server-side secret>
server-side repository adapter
reviewed deployment target
rate-limit or abuse-control layer
```

## Safety boundary

Current safe state:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

`ENABLE_INTAKE_PERSISTENCE` must not be prefixed with `VITE_` because this is server-side behavior only.

## Persistence sequence draft

When enabled later, the server-side sequence should be:

```text
1. Validate protected endpoint request.
2. Validate website intake payload.
3. Create or match contact.
4. Create contact-brand profile.
5. Create conversation.
6. Create inbound website message.
7. Create intake request.
8. Create follow-up task.
9. Create audit event.
10. Return intake/conversation/task IDs to server caller only.
```

QL-014 drafts the mapping, not production persistence.

## No new Supabase migration

QL-014 does not require a new Supabase migration. Existing tables from QL-007 already contain the destination shapes.

Future production persistence may need additional constraints or idempotency keys before go-live.

## Idempotency follow-up

Before connecting real forms, add one of these duplicate-prevention strategies:

- a deterministic external submission ID from the website;
- a hash of brand + form + timestamp + email/phone + message;
- a `provider_submission_id` column or metadata field;
- a unique constraint where appropriate.

This is intentionally deferred because QL-014 is only the adapter draft.

## Non-goals

- Do not connect live RosieDazzlers or DevilnDove forms yet.
- Do not enable public anonymous Supabase policies.
- Do not expose service-role keys, database URLs, JWT secrets, or shared secrets.
- Do not send customer replies.
- Do not enable phone/SMS.
- Do not enable AI auto-send.
- Do not store production customer records yet.

## Next build

QL-015 — Protected Intake Deployment Readiness Gate.

Goal:

- Decide where the protected endpoint will run.
- Confirm environment variables and secret placement.
- Add deployment-specific wrapper only after target is selected.
- Keep live intake disabled until reviewed.
