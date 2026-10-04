# Remote Operator Checklist — QL-014 Intake Persistence Adapter Draft

Use this checklist when reviewing the persistence adapter draft from GitHub without local Bash.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Files to review

```text
api/persistence/intakePersistenceAdapter.ts
api/contracts/intake-persistence-plan.schema.json
api/contracts/intake-persistence-example.plan.json
docs/27_INTAKE_PERSISTENCE_ADAPTER_DRAFT.md
```

## Current safe settings

Keep these values disabled for now:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

## Server-only secret reminder

The intake shared secret must be a server-side secret only:

```text
INTAKE_SHARED_SECRET=<long random shared secret>
```

Do not prefix it with `VITE_`.

## Do not configure yet

Do not configure a service-role key, database URL, JWT secret, or production customer-data persistence in any browser-visible variable.

## Review checklist

- [ ] Adapter maps contact.
- [ ] Adapter maps contact-brand profile.
- [ ] Adapter maps conversation.
- [ ] Adapter maps inbound website message.
- [ ] Adapter maps intake request.
- [ ] Adapter maps follow-up task.
- [ ] Adapter maps audit event.
- [ ] Live persistence stays disabled until a deployment target is chosen.
- [ ] No direct public website write to Supabase is introduced.

## Next safe step

QL-015 should choose the deployment target for the protected endpoint before any live website form is connected.
