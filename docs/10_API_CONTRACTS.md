# 10 — API Contracts

## Purpose

Define early request/response shapes for future integrations.

No endpoint is live in QL-001.

## Authentication principle

Public website forms must not write directly without authentication/spam protection. Use signed server-to-server calls or protected endpoints when implemented.

## Create intake request

Draft endpoint:

```http
POST /api/intakes
```

Draft payload:

```json
{
  "brand": "rosiedazzlers",
  "source": "website_quote_form",
  "customer": {
    "name": "Example Customer",
    "phone": "+15195551212",
    "email": "customer@example.com",
    "town": "Tillsonburg"
  },
  "intake": {
    "type": "detailing_quote",
    "raw_answers": {},
    "flags": ["pet_hair", "needs_photos"],
    "recommended_service": "Interior Detail"
  },
  "message": {
    "body": "Customer requested an interior detail quote."
  }
}
```

Expected result:

```json
{
  "ok": true,
  "contact_id": "...",
  "conversation_id": "...",
  "intake_request_id": "...",
  "follow_up_task_id": "..."
}
```

## Create manual phone call record

Draft endpoint:

```http
POST /api/phone-calls
```

Draft payload:

```json
{
  "brand": "rosiedazzlers",
  "direction": "inbound",
  "from_number": "+15195551212",
  "to_number": "+15195550000",
  "status": "missed",
  "started_at": "2026-10-02T12:00:00-04:00"
}
```

Expected behavior:

- find or create contact by phone
- create phone call record
- create or update conversation
- create follow-up task if missed

## Create message/note

Draft endpoint:

```http
POST /api/conversations/{conversation_id}/messages
```

Draft payload:

```json
{
  "brand": "rosiedazzlers",
  "direction": "internal",
  "channel": "admin_note",
  "body": "Customer needs photos before quote."
}
```

## AI draft endpoint later

Draft endpoint:

```http
POST /api/conversations/{conversation_id}/ai-draft
```

Rules:

- draft only
- no auto-send
- output must be marked AI-generated
- output must include missing information and confidence
