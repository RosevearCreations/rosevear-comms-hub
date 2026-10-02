# 05 — Data Model

## Data model principle

Every core table must be brand-aware and audit-friendly.

## Brand keys

Allowed initial values:

- `rosiedazzlers`
- `devilndove`

## Core tables

### contacts

Stores people or organizations.

Important fields:

- `id`
- `primary_brand`
- `name`
- `email`
- `phone`
- `town`
- `customer_type`
- `source`
- `notes`
- `created_at`
- `updated_at`

### contact_brand_profiles

Stores brand-specific details for a contact.

Important fields:

- `id`
- `contact_id`
- `brand`
- `status`
- `lead_quality`
- `last_contacted_at`
- `notes`

### conversations

A brand-specific thread of communication.

Important fields:

- `id`
- `brand`
- `contact_id`
- `source_channel`
- `status`
- `priority`
- `subject`
- `summary`
- `assigned_to`
- `last_activity_at`
- `created_at`
- `updated_at`

### messages

Individual inbound/outbound/internal messages.

Important fields:

- `id`
- `brand`
- `conversation_id`
- `contact_id`
- `direction`
- `channel`
- `body`
- `media_urls_json`
- `ai_generated`
- `human_approved`
- `approved_by`
- `sent_at`
- `created_at`

### intake_requests

Structured customer request created from forms, phone notes, or manual entry.

Important fields:

- `id`
- `brand`
- `contact_id`
- `conversation_id`
- `intake_type`
- `status`
- `raw_answers_json`
- `recommended_service`
- `estimated_price_min`
- `estimated_price_max`
- `needs_human_review`
- `created_at`
- `updated_at`

### follow_up_tasks

Action items.

Important fields:

- `id`
- `brand`
- `contact_id`
- `conversation_id`
- `title`
- `description`
- `due_at`
- `priority`
- `status`
- `created_at`
- `completed_at`

### tags

Reusable tags per brand.

Important fields:

- `id`
- `brand`
- `name`
- `slug`
- `description`
- `active`

### conversation_tags

Join table for conversations and tags.

### phone_calls

Provider-neutral phone call records.

Important fields:

- `id`
- `brand`
- `contact_id`
- `conversation_id`
- `direction`
- `from_number`
- `to_number`
- `provider`
- `provider_call_id`
- `status`
- `started_at`
- `ended_at`
- `duration_seconds`
- `recording_url`
- `voicemail_url`
- `transcript`
- `ai_summary`
- `follow_up_required`

### sms_messages

Provider-neutral SMS/MMS records.

Important fields:

- `id`
- `brand`
- `contact_id`
- `conversation_id`
- `direction`
- `from_number`
- `to_number`
- `body`
- `media_urls_json`
- `provider`
- `provider_message_id`
- `status`
- `ai_generated`
- `human_approved`
- `created_at`

### ai_draft_replies

AI-generated drafts awaiting review.

Important fields:

- `id`
- `brand`
- `conversation_id`
- `draft_body`
- `purpose`
- `confidence`
- `missing_info_json`
- `approved`
- `approved_by`
- `sent`
- `created_at`

### consent_logs

Records consent for call recording, SMS, email, marketing, and AI processing where applicable.

Important fields:

- `id`
- `brand`
- `contact_id`
- `consent_type`
- `consent_source`
- `consent_text`
- `consented_at`
- `revoked_at`

### audit_events

Tracks important changes.

Important fields:

- `id`
- `brand`
- `actor_id`
- `entity_type`
- `entity_id`
- `event_type`
- `event_data_json`
- `created_at`

## Status enums draft

Conversation statuses:

- `new`
- `needs_reply`
- `waiting_on_customer`
- `needs_photos`
- `quote_needed`
- `quote_sent`
- `booked`
- `completed`
- `archived`

Task statuses:

- `open`
- `in_progress`
- `blocked`
- `done`
- `cancelled`

Lead quality:

- `unknown`
- `green`
- `yellow`
- `red`

## Important implementation notes

- Do not expose internal lead quality labels to customers.
- Do not store sensitive data unless needed for a clear business purpose.
- Do not store call recordings before consent language and retention rules are active.
- Use JSON fields for intake answers early, then normalize after patterns are proven.
