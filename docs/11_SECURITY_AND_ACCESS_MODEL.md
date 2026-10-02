# 11 — Security and Access Model

## Security goal

Protect customer conversations, phone numbers, addresses, photos, quotes, and future call recordings/transcripts.

## Initial access model

QL-001 has no live app users yet.

When implemented, start with owner/admin-only access.

## Roles draft

### Owner

Full access to all brands, settings, exports, integrations, and deletion controls.

### Admin

Manage contacts, conversations, tasks, intakes, templates, and drafts.

### Brand operator

Access only assigned brand workspace.

### Read-only reviewer

View conversations and summaries but cannot send messages or change settings.

## Brand separation

Every record must carry a `brand` where applicable.

A user with access to RosieDazzlers only must not see DevilnDove conversations.

## Message approval

Any AI-generated customer-facing message must have:

- `ai_generated = true`
- `human_approved = false` until reviewed
- approver recorded before sending

## Secrets management

Never commit:

- API keys
- SIP credentials
- SMS provider tokens
- AI API keys
- webhook secrets
- database passwords

Use environment variables and `.env.example` only.

## Audit events

Audit these actions:

- status changes
- lead quality changes
- message sent
- AI draft approved
- task completed
- contact merged
- phone provider event received
- consent recorded/revoked
- export/download of customer data

## Data deletion

Future app should support:

- archive contact
- delete test records
- redact sensitive notes
- remove recordings/transcripts according to retention rules

Do not add destructive delete buttons without confirmation and audit.
