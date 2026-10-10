# Telephony Boundary — QL-089 Browser-Safe Supabase Read-Only Client Plan

QL-089 does not change telephony runtime.

## Allowed

- Public disabled preview copy updates.
- Browser-local brand switching.
- Browser-local synthetic conversation selection.
- Browser-local detail tab switching.
- Planning browser-safe read-only Supabase boundaries for a later build.
- Naming synthetic-only future read sources and fallback behavior.

## Blocked

- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Recording or transcript ingestion.
- Provider account connection.
- Provider live-number attachment.
- Callback registration.
- Live customer reads or writes.
- Archive writes.
- Retention writes.
- AI-generated sending.
- Live pilot runtime.

## Supabase boundary

QL-089 does not instantiate a Supabase browser client. A future build may read only synthetic public-safe outputs after anon-key and RLS boundaries are confirmed.

## Next safe step

QL-090 may scaffold a browser-safe read-only client only for synthetic public outputs, with hard-coded local fallback as the default failure mode.
