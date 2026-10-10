# Telephony Boundary — QL-085 Detail Tabs Plan

QL-085 does not change telephony runtime.

## Allowed

- Public disabled preview copy updates.
- Browser-local brand switching.
- Browser-local synthetic conversation selection.
- Planning disabled detail tabs for Overview, Draft, Timeline, and Safety.

## Blocked

- Provider callback registration.
- Live phone webhook routes.
- SMS send routes.
- Voice/call runtime.
- Call recordings.
- Transcripts.
- Provider inbox imports.
- Supabase-backed conversation reads.
- Live customer reads/writes.
- AI draft generation or auto-send.
- Archive writes.
- Retention writes.
- Live pilot activation.

## Next safe path

QL-086 may implement local detail-tab switching only with hard-coded synthetic data and browser-local React state.
