# 26 — Protected Intake Endpoint Skeleton

## Build

QL-013 — Protected Intake Endpoint Skeleton.

## Result

QL-013 adds the first provider-neutral server-side endpoint skeleton for website intake submissions.

This is still not a live public endpoint. It is intentionally disabled by default and does not write to live customer data unless a future build wires a persistence adapter.

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
api/endpoints/protectedIntakeEndpoint.ts
api/contracts/protected-intake-response.schema.json
api/contracts/protected-intake-example.request.json
docs/26_PROTECTED_INTAKE_ENDPOINT_SKELETON.md
docs/builds/QL-013-protected-intake-endpoint-skeleton.md
scripts/remote-operator-protected-intake-endpoint-checklist.md
```

## Endpoint behavior

The endpoint skeleton:

- rejects requests unless `ENABLE_PROTECTED_INTAKE_ENDPOINT=true`;
- accepts only `POST`;
- checks allowed origins when `ALLOWED_INTAKE_ORIGINS` is configured;
- requires the server-side `INTAKE_SHARED_SECRET`;
- validates the QL-012 website intake payload shape;
- returns dry-run success when validation passes but no persistence adapter is wired;
- does not grant anonymous Supabase table access;
- does not write contacts, conversations, messages, intakes, or tasks yet.

## Environment and secret names

For GitHub Actions or a future deployment provider, keep browser-safe variables separate from server-only secrets.

### Existing browser-safe values

These can stay as repository variables:

```text
VITE_ENABLE_HOSTED_DATABASE=true
VITE_ENABLE_SUPABASE_CLIENT=true
VITE_ENABLE_SUPABASE_LOGIN=true
VITE_SUPABASE_URL=https://gxujcwpktaickcgzyvnu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key from Supabase>
```

### New server-side values for the endpoint

Keep disabled until the endpoint is actually deployed:

```text
ENABLE_PROTECTED_INTAKE_ENDPOINT=false
ALLOWED_INTAKE_ORIGINS=https://rosiedazzlers.ca,https://devilndove.com,https://devilndove.online
```

When a future deployment needs to accept real server-to-server intake calls, add this as a **secret**, not a variable:

```text
INTAKE_SHARED_SECRET=<long random shared secret>
```

Do not prefix this secret with `VITE_`.

## GitHub environment titles

Use these environment titles only when deployment-specific settings or approvals are needed:

```text
preview
production
```

For ordinary repository-wide values, use:

```text
Repository → Settings → Secrets and variables → Actions
```

## Supabase boundary

QL-013 does not require a new Supabase migration.

The public websites still must not write directly to Supabase app tables. The protected design remains:

```text
Public website form
→ server-side endpoint/function
→ validates origin, secret, payload, and rate limits
→ writes through protected server code in a later build
→ hub admin reviews before any customer reply
```

## Non-goals

- Do not expose direct browser writes to Supabase.
- Do not enable public anonymous table policies.
- Do not connect RosieDazzlers or DevilnDove live forms yet.
- Do not create or send customer replies.
- Do not enable phone/SMS.
- Do not enable AI auto-send.
- Do not store production customer records yet.

## Next build

QL-014 — Intake Persistence Adapter Draft.

Goal:

- Draft the server-side persistence adapter that turns a validated intake payload into contact, conversation, message, intake, task, and audit records.
- Keep the live endpoint disabled until persistence and deployment are reviewed.
