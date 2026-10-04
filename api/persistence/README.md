# API Persistence

QL-014 introduces draft server-side persistence planning for protected website intake submissions.

The current adapter is deliberately provider-neutral. It maps a validated website intake payload into the records the hub should eventually create:

- contact
- contact brand profile
- conversation
- inbound website message
- intake request
- follow-up task
- audit event

No live persistence is enabled by default. Do not wire this to public browser code. Public websites must call a protected server-side endpoint, and server code must use protected credentials only after review.

## Current file

```text
api/persistence/intakePersistenceAdapter.ts
```

## Safety flags

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ENABLE_INTAKE_PERSISTENCE=false
```

Keep both false until the endpoint, deployment target, secret handling, rate limits, and persistence adapter have been reviewed.
