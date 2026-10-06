# Disabled Dry-Run Runtime Verification

Build: QL-028

## Runtime posture

The phone/SMS path remains provider-neutral and disabled by default.

QL-028 verifies only the local/runtime behavior needed before a later explicit provider-callback enablement gate:

1. Disabled mode returns `HTTP 503`.
2. Synthetic voice fixture dry-run returns no persistence.
3. Synthetic SMS fixture dry-run returns no persistence.
4. Non-synthetic payloads are rejected.
5. Provider webhook configuration remains false.
6. Live customer reads and writes remain false.

## Synthetic fixture boundary

Use alias labels such as:

```text
synthetic-caller-alias
test-number-alias-only
synthetic-contact
human-review-task
```

Do not use actual phone numbers, existing numbers, customer names, customer message content, recordings, transcripts, invoices, screenshots, credentials, provider portal documents, or live payloads.

## Later work

QL-029 may review how synthetic dry-run evidence maps into contact, conversation, and task shapes. QL-029 still must not enable provider webhooks or live phone/SMS features unless a later explicit enablement gate says so.
